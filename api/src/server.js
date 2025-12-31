require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 4000;
const TEST_OTP = process.env.TEST_OTP || '123456';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['*'];

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
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

// Schema migration is expected to be run separately; keep runtime simple for environments without direct DB TCP access.

function maskAadhaar(aadhaarNumber) {
  return aadhaarNumber.replace(/.(?=.{4})/g, 'x');
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
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

    const insertPayload = {
      id: uuidv4(),
      aadhaar_number_encrypted: aadhaar_number,
      aadhaar_last4: aadhaar_number.slice(-4),
      otp_txn_id: txnId,
      otp_verified: false,
      otp_expires_at: expiresAt.toISOString(),
    };

    const upsertResult = await supabase.from('aadhaar_checks').upsert(insertPayload, { onConflict: 'otp_txn_id' }).select().single();
    if (upsertResult.error) {
      console.error('Failed to upsert aadhaar_check', upsertResult.error);
      return res.status(500).json({ error: 'Failed to start Aadhaar verification' });
    }

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

    const { data: check, error: checkError } = await supabase
      .from('aadhaar_checks')
      .select('*')
      .eq('otp_txn_id', txn_id)
      .limit(1)
      .maybeSingle();
    if (checkError) {
      console.error('Failed to fetch aadhaar_check', checkError);
      return res.status(500).json({ error: 'Failed to fetch Aadhaar session' });
    }

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

    const { error: updateError } = await supabase
      .from('aadhaar_checks')
      .update({ otp_verified: true, updated_at: new Date().toISOString() })
      .eq('otp_txn_id', txn_id);
    if (updateError) {
      console.error('Failed to update aadhaar_check', updateError);
      return res.status(500).json({ error: 'Failed to mark Aadhaar verified' });
    }

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

    const { data: check, error: checkError } = await supabase
      .from('aadhaar_checks')
      .select('*')
      .eq('otp_txn_id', txn_id)
      .limit(1)
      .maybeSingle();
    if (checkError) {
      console.error('Failed to fetch aadhaar_check for signup', checkError);
      return res.status(500).json({ error: 'Failed to fetch Aadhaar session' });
    }

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
    const { error: insertUserError } = await supabase.from('users').insert({
      id: userId,
      aadhaar_check_id: check.id,
      aadhaar_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (insertUserError) {
      console.error('Failed to insert user', insertUserError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

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
