# Cretek SchoolOS — Deployment & Operations Runbook

Operational reference for installing, running, updating and backing up a
Cretek SchoolOS installation. Commands below are the real scripts from
`package.json` — run them from the repository root.

## 1. Overview

**Product:** Cretek SchoolOS `1.0.0` (`src/config/product.ts`, overridable per
installation via `PRODUCT_*` env vars).

**Business model — this is NOT SaaS.** Every school gets its own independent
installation: its own server/process, its own PostgreSQL database, its own
`.env`, its own branding and its own module selection. There is no shared
tenancy, no multi-tenant schema and no cross-school data access. Cretek
maintains the master repository; each customer installation is deployed from
it and then configured per school. Anything school-specific lives in **two**
places only — the installation's `.env` file and its database — which is what
lets code updates run without touching customer configuration.

## 2. Fresh installation for a new school

```bash
# 1. Clone the master repository
git clone <master-repo-url> schoolos-<school>
cd schoolos-<school>
git checkout <tag-or-commit>          # pin a released version

# 2. Install dependencies (postinstall runs `prisma generate` automatically)
npm install

# 3. Create an empty database for this school (example)
createdb schoolos_<school>
# …or let a DBA create it, then note the connection string.

# 4. Create this installation's environment file and fill in EVERY value
cp .env.example .env
#    edit .env: DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL,
#    ADMIN_EMAIL, ADMIN_PASSWORD, SCHOOL_* , PRODUCT_* (see section 3)

# 5. Create the schema
npm run db:push

# 6. Seed the school row + admin account
npm run db:seed
#    Seeding is env-driven. In production it REFUSES to run unless
#    ADMIN_EMAIL and ADMIN_PASSWORD are set in .env. It prints the exact
#    credentials it created — record them, then change the admin password
#    after first login.

# 7. Configure branding in the admin portal
#    System Configuration → Branding (/admin/settings)
#    school name, logo, accent/secondary colours, contact details,
#    invoice prefix/notes, currency, email signature/footer.

# 8. Configure modules
#    System Configuration → Modules (a tab inside /admin/settings)
#    enable only what this school licensed (see section 5).

# 9. Create the school administrator account
#    Users & Invitations (/admin/users) — or use the seeded admin and
#    invite the real administrator, then disable/remove the seed account.

# 10. Build for production
npm run build

# 11. Start the server
npm run start                 # serves on PORT (default 3000)

# 12. Point the domain at the process
#     reverse proxy (nginx/caddy/traefik) → http://127.0.0.1:3000
#     set NEXTAUTH_URL and NEXT_PUBLIC_APP_URL in .env to the public URL,
#     then restart. TLS terminates at the proxy.

# 13. Set up backups (section 7) BEFORE going live.

# 14. Go live — run the verification checklist (section 9).
```

**Prisma note:** the current workflow is `npm run db:push` (schema-first, no
migration history). Adopting `npm run db:migrate` later is possible — from
that point on use `db:migrate` for schema changes and generate an initial
migration from the existing schema — but do not mix the two on one database.
`npm run db:reset` drops and re-creates the database with migrations
(destructive). `npm run db:studio` opens Prisma Studio (read/write the data —
use with care).

## 3. Environment variables

Template: `.env.example`. Copy to `.env` per installation. Secrets are marked
🔒 — never commit `.env`, never reuse one school's `.env` for another.

| Variable | Purpose | Required? | Example |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string for THIS school's database | ✅ required | `postgresql://user:pass@localhost:5432/schoolos_acme?schema=public` |
| `AUTH_SECRET` | 🔒 Session/JWT signing secret | ✅ required | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public base URL used by NextAuth callbacks | ✅ required in prod | `https://school.example.com` |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL (SEO, sitemap) — `NEXT_PUBLIC_` vars are inlined at build time | ✅ required in prod | `https://school.example.com` |
| `PRODUCT_NAME` | Product/display name (default "Cretek SchoolOS") | optional | `Cretek SchoolOS` |
| `PRODUCT_VERSION` | Version shown in the UI | optional | `1.0.0` |
| `COMPANY_NAME` | Vendor/company name | optional | `Cretek` |
| `COMPANY_WEBSITE` | Vendor/company website | optional | `https://cretek.co.za` |
| `SUPPORT_EMAIL` | Support contact shown in UI/emails | optional | `info@cretek.co.za` |
| `PRODUCT_LOGO` | Path/URL of the product logo | optional | `/favicon.svg` |
| `PRIMARY_COLOR` | Default primary/accent colour (hex) | optional | `#D10000` |
| `SECONDARY_COLOR` | Default secondary colour (hex) | optional | `#1A1A1A` |
| `SCHOOL_NAME` | School name written by `db:seed` | recommended | `Greenfield College` |
| `SCHOOL_LOGO` | School logo path/URL (runtime logo is normally uploaded in the admin UI) | optional | `` |
| `SCHOOL_EMAIL` | School contact email (seed) | recommended | `office@greenfield.example` |
| `SCHOOL_PHONE` | School phone (seed) | optional | `+27 11 000 0000` |
| `SCHOOL_ADDRESS` | Street address (seed) | optional | `1 Main Street` |
| `SCHOOL_CITY` | City (seed) | optional | `Cape Town` |
| `SCHOOL_WEBSITE` | School website (seed) | optional | `https://greenfield.example` |
| `ADMIN_EMAIL` | 🔒 Primary admin login created by `db:seed` | ✅ required in prod | `admin@greenfield.example` |
| `ADMIN_PASSWORD` | 🔒 Password for that admin account | ✅ required in prod | `a-long-unique-password` |
| `RESEND_API_KEY` | 🔒 Resend API key for transactional email | optional (email disabled without it) | `` |
| `EMAIL_FROM` | From-header for outgoing mail | optional | `Greenfield College <noreply@greenfield.example>` |
| `DEMO_MODE` | Enables demo behaviour + `demo:reset` — demo host ONLY | demo only | `true` |
| `DEMO_ADMIN_EMAIL` | Demo admin login | demo only | `demo@schoolos.demo` |
| `DEMO_ADMIN_PASSWORD` | 🔒 Demo admin password (required in prod demo) | demo only | `` |
| `NEXT_PUBLIC_DEMO_BANNER` | Banner text shown across the demo UI | demo only | `This is a public demo — data resets nightly` |

Also supported (documented, not in `.env.example`):
`TEACHER_EMAIL`/`TEACHER_PASSWORD` and `PARENT_EMAIL`/`PARENT_PASSWORD`
(seed-only sample accounts; skipped in production unless both are set), plus
the `NEXT_PUBLIC_` variant of every product identity variable
(`NEXT_PUBLIC_PRODUCT_NAME`, `NEXT_PUBLIC_PRODUCT_VERSION`,
`NEXT_PUBLIC_COMPANY_NAME`, `NEXT_PUBLIC_COMPANY_WEBSITE`,
`NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_PRODUCT_LOGO`,
`NEXT_PUBLIC_PRIMARY_COLOR`, `NEXT_PUBLIC_SECONDARY_COLOR`) for values that
must be correct in the browser.

Development-only seed fallbacks (`admin@example.com` / `admin123`,
`teacher@example.com` / `teacher123`, `parent@example.com` / `parent123`) are
disabled when `NODE_ENV=production`.

## 4. Branding configuration

Two layers, applied in this order:

1. **Environment (product/defaults)** — `PRODUCT_*` and `PRIMARY_COLOR` /
   `SECONDARY_COLOR` in `.env` define the product identity and the default
   brand colours for the installation (`src/config/product.ts`). They are read
   at build/boot time; changing them requires editing `.env` and rebuilding or
   restarting.
2. **Database (per-school override, applied at runtime)** — the `School` row
   holds the school's name, logo, accent/secondary colours, font, contact
   details, invoice defaults (prefix, notes, terms, currency) and email
   defaults (signature, footer). Edited at **System Configuration →
   Branding** (`/admin/settings`, API `PUT /api/settings`; logo upload via
   `/api/settings/logo`).

Rules of thumb:

* `db:seed` writes `SCHOOL_*` / `PRIMARY_COLOR` / `SECONDARY_COLOR` into the
  `School` row **only for a new database** (existing values are left alone
  unless the corresponding env var is set explicitly).
* After first login, branding is changed in the admin UI — that always wins
  over env defaults because the DB row is read at runtime.
* Env vars are the right place for installation-wide identity (product name,
  version, default colours); the admin UI is the right place for
  school-specific branding (logo, colours, invoice/email templates).

## 5. Modules

* **Registry:** `src/lib/modules.ts` — the single list of modules
  (`MODULES`) with id, name, category, `core` flag, `dependsOn` and default
  state. Core modules (Dashboard, Users & Invitations, System Configuration)
  are always on and cannot be disabled.
* **Where the setting lives:** the enabled id list is stored on the `School`
  row in `enabledModules String[]` (empty array = product defaults, i.e. all
  default-enabled modules). Edited in the admin portal at **System
  Configuration → Modules**, persisted by `PUT /api/modules`
  (`{ enabled: ["students", ...] }`), read back by `GET /api/modules`.
* **Dependencies:** validated before saving
  (`validateModuleSelection`). A selection that would disable a dependency is
  rejected with a message such as:

  ```
  Invoicing & Fees requires Student Management to be enabled.
  ```

  (every error is `<Module> requires <Dependency> to be enabled.`). Core
  modules are always added back to the selection, and stored ids that are no
  longer in the registry are ignored.
* **Disabling never deletes data.** Turning a module off hides its
  navigation and blocks its routes; the underlying rows stay in the database
  and reappear immediately when the module is re-enabled.

## 6. Demo environment

The public demo is a separate installation with a **separate database**.

```bash
# on the demo host only
DEMO_MODE="true"
DEMO_ADMIN_EMAIL="demo@schoolos.demo"
DEMO_ADMIN_PASSWORD="<set-explicitly-in-production>"
NEXT_PUBLIC_DEMO_BANNER="Public demo — data resets nightly"
DATABASE_URL="postgresql://.../schoolos_demo"   # NEVER a customer database
```

Nightly reset — `npm run demo:reset` (`scripts/demo-reset.ts`):

* runs `npx prisma db push --force-reset --accept-data-loss`, then
  `npx tsx prisma/seed.ts`;
* **refuses** (exit 1) if `NODE_ENV=production`, if `DEMO_MODE` is not
  exactly `true`, or if `DATABASE_URL` is missing.

Cron (once nightly, demo host only):

```cron
0 3 * * * cd /opt/schoolos-demo && npm run demo:reset >> /var/log/schoolos-demo-reset.log 2>&1
```

**Warnings**

* **Never run `npm run demo:reset` against a production or customer
  database** — it drops every table. The script refuses to run in production
  and refuses when `DEMO_MODE` is not `true`, but the safety of that depends
  on the demo host's `.env`; a wrongly copied `.env` is still a real risk.
* **Never point `DATABASE_URL` at a customer database**, on any host that has
  `DEMO_MODE=true`.
* Do not schedule `demo:reset` on customer installations — customer data is
  restored only from backups (section 7), never from the seed.

## 7. Backups

**Git is version control, not a database backup.** It contains code only —
no school data, no uploaded files, no `.env`. Every installation needs its
own backup routine.

**1. PostgreSQL logical backup (`pg_dump`), nightly:**

```cron
30 2 * * * pg_dump --no-owner --clean --if-exists "$DATABASE_URL" | gzip > /var/backups/schoolos/schoolos_$(date +\%F).sql.gz
```

Retention: keep daily for 7 days, weekly for 4–5 weeks, monthly for 6–12
months (adjust to the school's requirements and legal obligations).

**Restore (test it — an untested backup is not a backup):**

```bash
gunzip -c schoolos_2026-10-01.sql.gz | psql "$DATABASE_URL"
# or, if the dump is gzipped schema+data and the DB must be rebuilt first:
npm run db:push        # recreate schema, then restore the dump
```

**2. Uploaded files / local assets** — school logos, generated documents and
any other files written under the installation (e.g. `public/`): include the
upload directory in the same nightly job (`tar`/`rsync` to off-host storage).

**3. `.env` and config** — back up `.env` (encrypted, access-controlled:
it holds `AUTH_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`, admin credentials).
Restoring code + `.env` + database dump restores the whole installation.

Store backups **off the application host**, verify restore procedure at least
once per release cycle.

## 8. Updating a customer installation

Customer-specific configuration lives in `.env` + the database, so a code
update never overwrites school branding, modules or data.

```bash
# 0. BACKUP FIRST (database + .env + uploads) — see section 7
pg_dump --no-owner "$DATABASE_URL" | gzip > /var/backups/pre-update.sql.gz

# 1. Fetch the master repo's tagged release
cd /opt/schoolos-<school>
git fetch --tags
git status                    # confirm no local edits to tracked files
git checkout <new-tag>        # e.g. v1.1.0

# 2. Install (postinstall runs `prisma generate`)
npm install

# 3. Apply schema changes
npm run db:push               # current workflow
# npm run db:migrate         # only if migrations were adopted for this install

# 4. Rebuild and restart
npm run build
npm run start                 # restart via systemd/supervisor/pm2 as configured

# 5. Verify (section 9)
```

**Rollback:** restore the pre-update database dump, `git checkout
<previous-tag>`, `npm install`, `npm run build`, restart. Schema changes
applied by `db:push` are not auto-reverted — that is exactly why the
pre-update dump is mandatory. Keep `.env` from the new version only if the
release notes say new variables are needed (add them, don't replace the file).

Never edit tracked source files on a customer server: local patches are lost
on the next update — send fixes to the master repository instead.

## 9. Health check / verification checklist

After every installation and every update:

- [ ] `npm run build` completed with no errors; `npm run start` is running.
- [ ] Site responds on the public URL over HTTPS (`NEXTAUTH_URL` /
      `NEXT_PUBLIC_APP_URL` match the domain).
- [ ] Login works with the configured admin account; password change works.
- [ ] System Configuration → Branding shows the school name, logo and
      colours, and they render across admin/teacher/parent portals.
- [ ] System Configuration → Modules saves without a dependency error and
      disabled modules are hidden (nav + routes blocked).
- [ ] A teacher and a parent account can sign in (or were intentionally not
      created).
- [ ] Outgoing email works (invite or test invoice) if `RESEND_API_KEY` and
      `EMAIL_FROM` are set — otherwise confirm the UI states email is not
      configured.
- [ ] The latest backup exists, is non-zero in size, and a restore was
      verified.
- [ ] On the demo host only: last night's `demo:reset` log line
      `Demo environment reset at <timestamp>` is present.
- [ ] No default/demo credentials are visible: seeded admin password was
      rotated, and demo credentials are not used on customer installs.
