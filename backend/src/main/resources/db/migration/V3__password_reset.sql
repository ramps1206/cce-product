-- Password-reset support: a single-use, time-limited token per user.
-- We store only the SHA-256 hash of the token (never the raw token), plus its
-- expiry. The raw token travels only in the emailed reset link.

ALTER TABLE app_users ADD COLUMN reset_token_hash   VARCHAR(64);
ALTER TABLE app_users ADD COLUMN reset_token_expires_at TIMESTAMPTZ;
