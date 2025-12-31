require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dns = require('dns');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 4000;
const TEST_OTP = process.env.TEST_OTP || '123456';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['*'];

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Force IPv4 because Render to Supabase over IPv6 can be unreachable.
  lookup: (hostname, opts, cb) => dns.lookup(hostname, { ...opts, family: 4, hints: dns.ADDRCONFIG }, cb),
});

const app = express();
app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// Gracefully handle bad JSON payloads early.
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  next(err);
});

async function ensureSchema() {
  // Create aadhaar_checks table and indexes if missing, and ensure users columns exist.
  await runQuery(
    `CREATE TABLE IF NOT EXISTS public.aadhaar_checks (
      id uuid PRIMARY KEY,
      aadhaar_number_encrypted text NOT NULL,
      aadhaar_last4 text NOT NULL,
      otp_txn_id text NOT NULL UNIQUE,
      otp_verified boolean DEFAULT false,
      otp_expires_at timestamptz NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );`
  );

  await runQuery('CREATE INDEX IF NOT EXISTS idx_aadhaar_checks_txn ON public.aadhaar_checks (otp_txn_id);');
  await runQuery('CREATE INDEX IF NOT EXISTS idx_aadhaar_checks_verified ON public.aadhaar_checks (otp_verified);');
  await runQuery('CREATE INDEX IF NOT EXISTS idx_aadhaar_checks_last4 ON public.aadhaar_checks (aadhaar_last4);');

  await runQuery('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS aadhaar_check_id uuid REFERENCES public.aadhaar_checks(id);');
  await runQuery('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS aadhaar_verified boolean DEFAULT false;');
  await runQuery('CREATE INDEX IF NOT EXISTS idx_users_aadhaar_verified ON public.users (aadhaar_verified);');
}

ensureSchema().catch((err) => {
  console.error('Failed to ensure schema', err);
  process.exit(1);
});

function maskAadhaar(aadhaarNumber) {
  return aadhaarNumber.replace(/.(?=.{4})/g, 'x');
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

async function runQuery(text, params) {
  const result = await pool.query(text, params);
  return result;
}

function isAadhaarNumber(value) {
  return /^[0-9]{12}$/.test(String(value || ''));
}

// Stub for Aadhaar OTP send
async function sendAadhaarOtp(aadhaarNumber) {
  // TODO: integrate official Aadhaar OTP send API
  const txnId = uuidv4();
  return { txnId };
}

// Stub for Aadhaar OTP verification
async function verifyAadhaarOtp(txnId, otp) {
  // TODO: integrate official Aadhaar OTP verify API
  return otp === TEST_OTP;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.post('/aadhaar/send-otp', async (req, res, next) => {
  try {
    const { aadhaar_number } = req.body || {};
    if (!isAadhaarNumber(aadhaar_number)) {
      return res.status(400).json({ error: 'Aadhaar number must be 12 digits' });
    }

    const { txnId } = await sendAadhaarOtp(aadhaar_number);
    const expiresAt = addMinutes(new Date(), 10);

    await runQuery(
      `INSERT INTO public.aadhaar_checks (
        id,
        aadhaar_number_encrypted,
        aadhaar_last4,
        otp_txn_id,
        otp_verified,
        otp_expires_at
      ) VALUES ($1, $2, $3, $4, false, $5)
      ON CONFLICT (otp_txn_id) DO UPDATE SET
        aadhaar_number_encrypted = EXCLUDED.aadhaar_number_encrypted,
        aadhaar_last4 = EXCLUDED.aadhaar_last4,
        otp_verified = false,
        otp_expires_at = EXCLUDED.otp_expires_at,
        updated_at = now();`,
      [uuidv4(), aadhaar_number, aadhaar_number.slice(-4), txnId, expiresAt]
    );

    res.json({ success: true, txn_id: txnId, masked: maskAadhaar(aadhaar_number) });
  } catch (err) {
    next(err);
  }
});

app.post('/aadhaar/verify-otp', async (req, res, next) => {
  try {
    const { aadhaar_number, otp, txn_id } = req.body || {};
    if (!isAadhaarNumber(aadhaar_number) || !otp || !txn_id) {
      return res.status(400).json({ error: 'aadhaar_number, otp, and txn_id are required' });
    }

    const checkResult = await runQuery(
      'SELECT * FROM public.aadhaar_checks WHERE otp_txn_id = $1 LIMIT 1',
      [txn_id]
    );
    const check = checkResult.rows[0];

    if (!check) {
      return res.status(404).json({ error: 'Aadhaar session not found' });
    }

    if (check.aadhaar_last4 !== aadhaar_number.slice(-4)) {
      return res.status(400).json({ error: 'Aadhaar number does not match this session' });
    }

    if (new Date() > new Date(check.otp_expires_at)) {
      return res.status(410).json({ error: 'OTP expired, please request a new one' });
    }

    const verified = await verifyAadhaarOtp(txn_id, otp);
    if (!verified) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    await runQuery(
      'UPDATE public.aadhaar_checks SET otp_verified = true, updated_at = now() WHERE otp_txn_id = $1',
      [txn_id]
    );

    res.json({ success: true, message: 'Aadhaar verified' });
  } catch (err) {
    next(err);
  }
});

app.post('/signup', async (req, res, next) => {
  try {
    const { txn_id, aadhaar_number, profile } = req.body || {};
    if (!txn_id || !isAadhaarNumber(aadhaar_number)) {
      return res.status(400).json({ error: 'Aadhaar verification is required before signup' });
    }

    const checkResult = await runQuery(
      'SELECT * FROM public.aadhaar_checks WHERE otp_txn_id = $1 LIMIT 1',
      [txn_id]
    );
    const check = checkResult.rows[0];

    if (!check) {
      return res.status(404).json({ error: 'Aadhaar session not found' });
    }

    if (!check.otp_verified) {
      return res.status(403).json({ error: 'Aadhaar not verified' });
    }

    if (new Date() > new Date(check.otp_expires_at)) {
      return res.status(410).json({ error: 'Aadhaar verification expired; please verify again' });
    }

    if (check.aadhaar_last4 !== aadhaar_number.slice(-4)) {
      return res.status(400).json({ error: 'Aadhaar number does not match this session' });
    }

    const userId = uuidv4();
    await runQuery(
      `INSERT INTO public.users (
        id,
        aadhaar_check_id,
        aadhaar_verified,
        created_at,
        updated_at
      ) VALUES ($1, $2, true, now(), now())`,
      [userId, check.id]
    );

    res.json({ success: true, user_id: userId, profile: profile || null });
  } catch (err) {
    next(err);
  }
});

// DigiLocker callback placeholder: integrate real exchange for auth code -> eKYC and mark Aadhaar verified.
app.post('/digilocker/callback', async (req, res) => {
  const { code, state } = req.body || {};
  if (!code) return res.status(400).json({ error: 'code is required' });
  // TODO: exchange code with DigiLocker, fetch eKYC, and map to aadhaar_checks.
  return res.status(501).json({ error: 'DigiLocker integration not implemented yet' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Aadhaar backend listening on port ${PORT}`);
});
