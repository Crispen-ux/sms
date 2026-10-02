# Cretek SchoolOS

Configurable school management product built with Next.js 16 +
Prisma/PostgreSQL. One codebase, deployed as an **independent installation
per school** — each school gets its own database, its own `.env`, its own
branding and its own module selection. Cretek maintains the master
repository. This is not SaaS: there is no shared tenancy.

## Quick start (development)

```bash
npm install              # also runs `prisma generate` via postinstall
cp .env.example .env     # fill in DATABASE_URL and the rest
npm run db:push          # create the schema
npm run db:seed          # school row + admin (dev default admin@example.com / admin123)
npm run dev              # http://localhost:3000
```

Production build: `npm run build` then `npm run start`.

Full install/update/backup procedures: **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate the Prisma client (also runs on `npm install`) |
| `npm run db:push` | Push `prisma/schema.prisma` to the database (current schema workflow) |
| `npm run db:migrate` | Prisma migrations (optional alternative to `db:push`) |
| `npm run db:seed` | Seed the school row, admin account and sample data (`prisma/seed.ts`) |
| `npm run db:reset` | Drop and recreate the database (destructive) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run demo:reset` | Nightly demo wipe — refuses to run outside a `DEMO_MODE=true` non-production host |

## Where things live

| Concern | Location |
|---|---|
| Product identity (name, version, company, logo, default colours) | [`src/config/product.ts`](src/config/product.ts) — env-overridable (`PRODUCT_*`, plus `NEXT_PUBLIC_*` for client-side) |
| Module registry (core/optional, dependencies, defaults) | [`src/lib/modules.ts`](src/lib/modules.ts) |
| Module enable/disable API | `PUT /api/modules`, UI at System Configuration → Modules |
| School branding, invoice/email defaults | `School` DB row, UI at System Configuration → Branding (`/api/settings`) |
| Database schema | [`prisma/schema.prisma`](prisma/schema.prisma) |
| Seed data | [`prisma/seed.ts`](prisma/seed.ts) |
| Deployment, backups, updates | [DEPLOYMENT.md](./DEPLOYMENT.md) |

## Configuration at a glance

1. **`.env` (per installation, never committed)** — database, auth, public
   URL, product identity (`PRODUCT_*`), seed school details (`SCHOOL_*`),
   admin credentials (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), email
   (`RESEND_API_KEY`, `EMAIL_FROM`). See `.env.example`.
2. **Database `School` row (runtime, per school)** — school name, logo,
   accent/secondary colours, contact details, invoice defaults, email
   signature/footer, and the enabled module list (`enabledModules`). Edited
   in the admin portal: **System Configuration → Branding** and
   **System Configuration → Modules**.
3. **Precedence** — env vars provide product identity and installation
   defaults; the database row is the per-school override applied at runtime
   and always wins in the UI.

Demo instances additionally set `DEMO_MODE=true`, `DEMO_ADMIN_*` and
`NEXT_PUBLIC_DEMO_BANNER`, and are wiped nightly by `npm run demo:reset`
(never run it against a customer database).
