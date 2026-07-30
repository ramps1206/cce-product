# CCE Software

A multi-tenant, offline-first SaaS rewrite of the Marathi **CCE (सतत सर्वंकष मूल्यमापन /
Continuous & Comprehensive Evaluation)** school-management app — converted from a single
1.7 MB HTML file (Firebase + Google Apps Script) into a proper client-server product.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.3.5, Java 21, Spring Web / Data JPA / Security, JWT, Flyway, Apache POI, BouncyCastle |
| Database | PostgreSQL (multi-tenant, JSONB data parts, tombstone sync) |
| Frontend | React 18 + Vite + TypeScript + Tailwind, Dexie (IndexedDB), PWA (offline-first) |

## Layout

```
backend/    Spring Boot API (auth, licensing, offline sync, Excel export)
frontend/   React + Vite PWA (13 screens, Marathi UI)
migration/  Firebase → Postgres migration tooling (run when ready)
```

## Local development

```bash
# 1. Postgres
brew services start postgresql@15          # DB: cce_dev, user: cce

# 2. Backend  (project-local Maven settings bypass the internal Nexus mirror)
cd backend && export JAVA_HOME=$(/usr/libexec/java_home -v 21)
mvn -s settings-central.xml -DskipTests package
java -jar target/cce-backend-0.1.0.jar     # http://localhost:8080

# 3. Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Open http://localhost:5173, register a school, and use the app. It works offline
(IndexedDB) and syncs to Postgres via the backend when online (🔄 सिंक).

## API

```
POST /api/auth/register | login | pin-login | set-pin      GET /api/auth/me
GET  /api/sync/pull?since=<iso>            POST /api/sync/push
GET  /api/export/students.xlsx?classId=
```

## Features

- **Auth & licensing**: JWT, PIN unlock, 15-day trial, device limits, platform gating, server-side tier enforcement (standard/pro/premium).
- **Offline-first sync**: part-based last-write-wins merge with tombstones; the whole DB works offline and reconciles on reconnect.
- **Modules**: classes, students, teachers, attendance, evaluation (marks → श्रेणी), semester report, report card, grades, scholarships, general register, school profile.
- **Excel export** via Apache POI (tier-gated).
- **Legacy import** of the old app's `cce_v76_data` blob.

See `LOCAL_PLAN.md` (untracked) for full build progress and remaining work.
