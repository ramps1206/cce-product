-- The original single-file app keys every array-part record (students, classes,
-- teachers, general register, scholarships) by an alphanumeric client id such as
-- "mretotk6ywn28oszy", NOT a number. The initial schema modelled client_id as
-- BIGINT, so the sync push (which does Long.parseLong on the key) rejected every
-- one of those records and nothing ever persisted to Postgres.
--
-- Widen client_id to TEXT so the app's native string ids round-trip unchanged.
-- TEXT also happily holds the numeric-string ids the new app mints via nextId().

ALTER TABLE students          ALTER COLUMN client_id TYPE TEXT;
ALTER TABLE classes           ALTER COLUMN client_id TYPE TEXT;
ALTER TABLE teachers          ALTER COLUMN client_id TYPE TEXT;
ALTER TABLE general_register  ALTER COLUMN client_id TYPE TEXT;
ALTER TABLE scholarships      ALTER COLUMN client_id TYPE TEXT;
