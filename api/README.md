# Aadhaar-first backend (minimal)

This lightweight service gates signup on Aadhaar OTP verification. OTP send/verify is stubbed; replace with the official UIDAI/DigiLocker integrations before production.

## Endpoints
- `POST /aadhaar/send-otp` body `{ aadhaar_number }` → returns `{ txn_id, masked }`; stores session with 10-minute expiry.
- `POST /aadhaar/verify-otp` body `{ aadhaar_number, otp, txn_id }` → verifies OTP (stub: matches `TEST_OTP`), marks session verified.
- `POST /signup` body `{ txn_id, aadhaar_number, profile? }` → creates user only if the session is verified and not expired.
- `GET /health` → health check.

## Run locally
```
cd api
cp .env.example .env
# set DATABASE_URL, PORT, ALLOWED_ORIGINS, TEST_OTP
npm install
npm run dev
```

## Database
Apply migrations in `../db/`:
- `add_aadhaar_checks_table.sql` adds `aadhaar_checks` and links `users` with `aadhaar_check_id` and `aadhaar_verified`.

## Notes
- `aadhaar_number_encrypted` currently stores the raw value; replace with real encryption + vaulting in production.
- OTP logic is stubbed; integrate the real Aadhaar/DigiLocker OTP send and verify APIs.
- Sessions expire after 10 minutes; clients should request a new OTP after expiry.
- Rate limiting and audit logging are recommended before going live.
