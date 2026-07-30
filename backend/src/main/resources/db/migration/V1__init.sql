-- CCE Software — initial multi-tenant schema.
-- Mirrors the original single-file app's data model (loadData()) and its
-- part-based offline sync engine (ARRAY_PARTS / MAP_PARTS + tombstones).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Tenancy, auth, licensing
-- ---------------------------------------------------------------------------
CREATE TABLE schools (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    udise       VARCHAR(32) UNIQUE,          -- school UDISE code (natural key)
    name        VARCHAR(255) NOT NULL DEFAULT '',
    address     VARCHAR(512) DEFAULT '',
    dist        VARCHAR(128) DEFAULT '',     -- district
    tal         VARCHAR(128) DEFAULT '',     -- taluka
    phone       VARCHAR(32)  DEFAULT '',
    prin        VARCHAR(255) DEFAULT '',     -- principal / headmaster
    med         VARCHAR(64)  DEFAULT 'मराठी',-- medium
    yr          VARCHAR(16)  DEFAULT '',     -- academic year e.g. 2026-27
    type        VARCHAR(128) DEFAULT '',
    school_code VARCHAR(64)  DEFAULT '',
    est_year    VARCHAR(16)  DEFAULT '',
    logo        TEXT,                        -- base64 data URI (as today)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE app_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    school_id     UUID REFERENCES schools(id) ON DELETE CASCADE,
    role          VARCHAR(32) NOT NULL DEFAULT 'TEACHER',  -- TEACHER | HEADMASTER | ADMIN
    pin_hash      VARCHAR(255),               -- Quick PIN Unlock (optional)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_users_school ON app_users(school_id);

CREATE TABLE licenses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    tier          VARCHAR(16) NOT NULL DEFAULT 'trial',   -- trial | standard | pro | premium
    status        VARCHAR(16) NOT NULL DEFAULT 'active',  -- active | expired | suspended
    key_string    VARCHAR(128) UNIQUE,
    max_devices   INT NOT NULL DEFAULT 1,
    platform      VARCHAR(16) NOT NULL DEFAULT 'both',    -- windows | mobile | both
    trial_ends_at TIMESTAMPTZ,
    issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ
);
CREATE INDEX idx_licenses_school ON licenses(school_id);

CREATE TABLE devices (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    device_id  VARCHAR(128) NOT NULL,        -- cce_device_id from the client
    platform   VARCHAR(16) NOT NULL DEFAULT 'both',
    label      VARCHAR(255),
    last_seen  TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (license_id, device_id)
);

-- ---------------------------------------------------------------------------
-- Data parts — offline-first sync
--   ARRAY_PARTS: one typed table each, keyed by the app's numeric client id.
--   Each row carries payload JSONB + updated_at + deleted (tombstone) so the
--   Java sync service can do the same per-item, last-write-wins merge the
--   original engine did.
-- ---------------------------------------------------------------------------
CREATE TABLE students (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    client_id  BIGINT NOT NULL,             -- student id from the app
    payload    JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted    BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (school_id, client_id)
);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_updated ON students(school_id, updated_at);

CREATE TABLE classes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    client_id  BIGINT NOT NULL,
    payload    JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted    BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (school_id, client_id)
);
CREATE INDEX idx_classes_school ON classes(school_id);

CREATE TABLE teachers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    client_id  BIGINT NOT NULL,
    payload    JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted    BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (school_id, client_id)
);
CREATE INDEX idx_teachers_school ON teachers(school_id);

CREATE TABLE general_register (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    client_id  BIGINT NOT NULL,
    payload    JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted    BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (school_id, client_id)
);
CREATE INDEX idx_genreg_school ON general_register(school_id);

CREATE TABLE scholarships (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    client_id  BIGINT NOT NULL,
    payload    JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted    BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (school_id, client_id)
);
CREATE INDEX idx_scholarships_school ON scholarships(school_id);

-- MAP_PARTS (evaluations, attendance, descriptiveNotes, bharansh) and scalar
-- parts (school, workingDays, settings) — key/value with per-key timestamps.
-- item_key = the map key; scalar parts use item_key = '_'.
CREATE TABLE school_kv (
    school_id  UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    part       VARCHAR(48) NOT NULL,        -- evaluations | attendance | descriptiveNotes | bharansh | workingDays | settings
    item_key   VARCHAR(128) NOT NULL,
    payload    JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted    BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (school_id, part, item_key)
);
CREATE INDEX idx_school_kv_updated ON school_kv(school_id, updated_at);

-- ---------------------------------------------------------------------------
-- Audit / login logs (mirror Firestore deviceLoginLog / emailLoginLog)
-- ---------------------------------------------------------------------------
CREATE TABLE audit_log (
    id         BIGSERIAL PRIMARY KEY,
    school_id  UUID REFERENCES schools(id) ON DELETE CASCADE,
    actor      VARCHAR(255),
    action     VARCHAR(128),
    detail     JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_school ON audit_log(school_id, created_at);

CREATE TABLE login_log (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(255),
    device_id  VARCHAR(128),
    platform   VARCHAR(16),
    success    BOOLEAN NOT NULL,
    ip         VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_login_log_email ON login_log(email, created_at);
