/**
 * NIGHTLY DEMO RESET — Cretek SchoolOS
 * ---------------------------------------------------------------------------
 * Destroys and re-seeds the DEMO database so the public demo instance returns
 * to a clean, known-good state every night.
 *
 * This script ONLY ever runs against the demo database. It performs
 * `prisma db push --force-reset --accept-data-loss`, which DROPS EVERY TABLE
 * in the database named by DATABASE_URL.
 *
 * Schedule it once nightly on the demo host only (see DEPLOYMENT.md):
 *
 *   0 3 * * * cd /opt/schoolos-demo && npm run demo:reset >> /var/log/schoolos-demo-reset.log 2>&1
 *
 * Safety rails (all three must pass, otherwise the script exits 1 without
 * touching anything):
 *   1. NODE_ENV must not be "production"
 *   2. DEMO_MODE must be exactly "true"
 *   3. DATABASE_URL must be present
 *
 * NEVER run this against a customer/production database.
 * ---------------------------------------------------------------------------
 */
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import * as path from "path";

function refuse(message: string): never {
  console.error(`\n✖ DEMO RESET REFUSED — ${message}\n`);
  process.exit(1);
}

// Load the installation's .env (READ-ONLY — this never writes to it) so the
// guards below and the child processes see DATABASE_URL / DEMO_MODE even when
// started from cron or a bare shell. Values already present in the real
// environment win over the file.
const envFile = path.join(process.cwd(), ".env");
if (existsSync(envFile) && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(envFile);
  } catch {
    console.warn(`⚠ Could not parse ${envFile} — continuing with the ambient environment.`);
  }
}

// Hard guard #1: never run in production.
if (process.env.NODE_ENV === "production") {
  refuse(
    "NODE_ENV is 'production'. This script must never run against a production " +
      "installation — it wipes the entire database. Set NODE_ENV=development (or " +
      "unset it) only on the dedicated demo instance."
  );
}

// Hard guard #2: only run where DEMO_MODE is explicitly enabled.
if (process.env.DEMO_MODE !== "true") {
  refuse(
    "DEMO_MODE is not set to 'true'. The demo reset only runs on the demo " +
      "instance, where DEMO_MODE=true is set in .env. Refusing to continue."
  );
}

// Hard guard #3: a database must be configured (and it must be the demo one).
if (!process.env.DATABASE_URL) {
  refuse(
    "DATABASE_URL is missing. The demo instance must define DATABASE_URL in " +
      ".env pointing at the dedicated demo database."
  );
}

const repoRoot = process.cwd();
if (!existsSync(path.join(repoRoot, "prisma", "seed.ts"))) {
  refuse(
    `prisma/seed.ts was not found in ${repoRoot}. Run this script from the ` +
      `repository root, e.g. "npm run demo:reset".`
  );
}

// Windows ships `npx.cmd`; POSIX ships `npx`. Windows also needs a shell.
const isWindows = process.platform === "win32";
const npx = isWindows ? "npx.cmd" : "npx";

function runStep(label: string, args: string[]): void {
  const command = `${npx} ${args.join(" ")}`;
  console.log(`\n→ ${label}`);
  console.log(`  $ ${command}`);

  const result = spawnSync(npx, args, {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
    shell: isWindows,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error) {
    console.error(`✖ ${label} failed to start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(
      `✖ ${label} failed with exit code ${result.status}` +
        (result.signal ? ` (signal ${result.signal})` : "")
    );
    process.exit(1);
  }

  console.log(`  ✓ ${label} OK`);
}

console.log("── Cretek SchoolOS demo reset ──────────────────────────────");
console.log(`  time:  ${new Date().toISOString()}`);
console.log(`  cwd:   ${repoRoot}`);
console.log(`  node:  ${process.env.NODE_ENV ?? "development"}`);

// Step 1: drop and recreate the schema from prisma/schema.prisma.
runStep("Resetting demo schema", [
  "prisma",
  "db",
  "push",
  "--force-reset",
  "--accept-data-loss",
]);

// Step 2: re-seed the demo data (prisma/seed.ts).
runStep("Seeding demo data", ["tsx", "prisma/seed.ts"]);

console.log(`\n✅ Demo environment reset at ${new Date().toISOString()}\n`);
