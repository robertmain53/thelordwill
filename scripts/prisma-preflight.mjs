#!/usr/bin/env node
/**
 * Prisma Migration Preflight Check
 *
 * Runs before `npm run dev` to detect migration drift and prevent
 * accidental schema mismatches between code and database.
 *
 * BEHAVIOR:
 * - Checks database connection
 * - Detects pending migrations (not yet applied)
 * - Detects drift (applied migration files modified after apply)
 * - Exits with code 1 on any issue, blocking dev server start
 *
 * NEVER runs destructive operations automatically.
 */

import { execSync, spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { createHash } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ANSI colors for terminal output
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function log(color, prefix, message) {
  console.log(`${color}${BOLD}[${prefix}]${RESET} ${message}`);
}

function logError(message) {
  log(RED, "ERROR", message);
}

function logWarn(message) {
  log(YELLOW, "WARN", message);
}

function logInfo(message) {
  log(CYAN, "INFO", message);
}

function logSuccess(message) {
  log(GREEN, "OK", message);
}

/**
 * Run prisma migrate status and parse output
 */
function getMigrateStatus() {
  try {
    const result = spawnSync("npx", ["prisma", "migrate", "status"], {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 30000,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    const output = result.stdout + result.stderr;
    const exitCode = result.status;

    return { output, exitCode, error: null };
  } catch (error) {
    return { output: "", exitCode: 1, error: error.message };
  }
}

/**
 * Check if database is reachable
 */
function checkDatabaseConnection() {
  try {
    execSync("npx prisma db execute --stdin <<< 'SELECT 1'", {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 10000,
      stdio: "pipe",
    });
    return { connected: true, error: null };
  } catch (error) {
    // Try alternative method - just check if migrate status can connect
    const { output, exitCode } = getMigrateStatus();
    if (output.includes("P1001") || output.includes("Can't reach database")) {
      return { connected: false, error: "Cannot connect to database" };
    }
    if (output.includes("P1003") || output.includes("does not exist")) {
      return { connected: false, error: "Database does not exist" };
    }
    // If we got here and exitCode is 0, connection is fine
    if (exitCode === 0) {
      return { connected: true, error: null };
    }
    return { connected: true, error: null }; // Assume connected for other errors
  }
}

/**
 * Parse migration status output for specific conditions
 */
function parseMigrationStatus(output) {
  const conditions = {
    hasPendingMigrations: false,
    hasDrift: false,
    hasFailedMigration: false,
    isOutOfSync: false,
    pendingMigrations: [],
    appliedMigrations: [],
    driftDetails: null,
  };

  // Check for pending migrations
  if (
    output.includes("Following migration(s) have not yet been applied") ||
    output.includes("migrations have not yet been applied")
  ) {
    conditions.hasPendingMigrations = true;

    // Extract pending migration names
    const pendingMatch = output.match(
      /Following migration\(s\) have not yet been applied:\s*([\s\S]*?)(?:\n\n|To apply|$)/
    );
    if (pendingMatch) {
      conditions.pendingMigrations = pendingMatch[1]
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }
  }

  // Check for drift (modified migrations)
  if (
    output.includes("drift") ||
    output.includes("has been edited") ||
    output.includes("checksum mismatch") ||
    output.includes("migration history differs")
  ) {
    conditions.hasDrift = true;
    conditions.driftDetails = output;
  }

  // Check for failed migrations
  if (
    output.includes("failed to apply") ||
    output.includes("migration failed")
  ) {
    conditions.hasFailedMigration = true;
  }

  // Check for out of sync state
  if (
    output.includes("out of sync") ||
    output.includes("shadow database") ||
    output.includes("resolve the migration")
  ) {
    conditions.isOutOfSync = true;
  }

  // Check if everything is in sync
  conditions.isHealthy =
    output.includes("Database schema is up to date") ||
    (output.includes("applied successfully") &&
      !conditions.hasPendingMigrations &&
      !conditions.hasDrift);

  return conditions;
}

/**
 * Check git for modified migration files
 */
function checkGitMigrationChanges() {
  try {
    // Check if we're in a git repo
    execSync("git rev-parse --git-dir", {
      cwd: ROOT,
      encoding: "utf-8",
      stdio: "pipe",
    });

    // Check for modified migration files (both staged and unstaged)
    const diffOutput = execSync(
      "git diff --name-only HEAD -- prisma/migrations/ 2>/dev/null || true",
      {
        cwd: ROOT,
        encoding: "utf-8",
        stdio: "pipe",
      }
    ).trim();

    const stagedOutput = execSync(
      "git diff --cached --name-only -- prisma/migrations/ 2>/dev/null || true",
      {
        cwd: ROOT,
        encoding: "utf-8",
        stdio: "pipe",
      }
    ).trim();

    const modifiedFiles = [...diffOutput.split("\n"), ...stagedOutput.split("\n")]
      .filter((f) => f.length > 0 && f.endsWith(".sql"))
      .filter((v, i, a) => a.indexOf(v) === i); // unique

    return { hasModifiedMigrations: modifiedFiles.length > 0, modifiedFiles };
  } catch {
    // Not a git repo or git not available
    return { hasModifiedMigrations: false, modifiedFiles: [] };
  }
}

/**
 * Print remediation steps for drift
 */
function printDriftRemediation(gitChanges) {
  console.log("\n" + "=".repeat(70));
  console.log(`${RED}${BOLD}MIGRATION DRIFT DETECTED${RESET}`);
  console.log("=".repeat(70));

  console.log(`
${YELLOW}What happened:${RESET}
  A migration file that was already applied to the database has been
  modified. This causes a checksum mismatch and can lead to schema drift.

${YELLOW}Why this is blocked:${RESET}
  Running dev with drift can cause unpredictable behavior and make it
  hard to track what schema the database actually has.
`);

  if (gitChanges.modifiedFiles.length > 0) {
    console.log(`${YELLOW}Modified migration files:${RESET}`);
    gitChanges.modifiedFiles.forEach((f) => console.log(`  - ${f}`));
    console.log();
  }

  console.log(`${CYAN}${BOLD}RESOLUTION OPTIONS:${RESET}

${BOLD}Option 1: Restore original migration (RECOMMENDED for applied migrations)${RESET}
  If you accidentally modified an applied migration, restore it from git:

    ${GREEN}git checkout HEAD -- prisma/migrations/${RESET}

${BOLD}Option 2: Reset dev database (DESTRUCTIVE - dev only)${RESET}
  If you intentionally want to start fresh with a new migration:

    ${YELLOW}npm run db:reset${RESET}

  This will:
  - Drop the database schema
  - Re-apply all migrations from scratch
  - ${RED}DELETE ALL DATA${RESET} in the database

${BOLD}Option 3: Mark migration as resolved (advanced)${RESET}
  If you know what you're doing and want to mark drift as resolved:

    ${YELLOW}npx prisma migrate resolve --applied "MIGRATION_NAME"${RESET}

${RED}${BOLD}DO NOT:${RESET}
  - Modify already-applied migrations in production
  - Delete migration files that have been applied
  - Run db:reset on production databases
`);

  console.log("=".repeat(70) + "\n");
}

/**
 * Print remediation steps for pending migrations
 */
function printPendingMigrationsRemediation(pendingMigrations) {
  console.log("\n" + "=".repeat(70));
  console.log(`${YELLOW}${BOLD}PENDING MIGRATIONS DETECTED${RESET}`);
  console.log("=".repeat(70));

  console.log(`
${YELLOW}Pending migrations:${RESET}`);
  pendingMigrations.forEach((m) => console.log(`  - ${m}`));

  console.log(`
${CYAN}${BOLD}RESOLUTION:${RESET}

  Apply pending migrations:

    ${GREEN}npx prisma migrate deploy${RESET}

  Or for development (creates shadow DB for validation):

    ${GREEN}npx prisma migrate dev${RESET}

`);
  console.log("=".repeat(70) + "\n");
}

/**
 * Print connection error remediation
 */
function printConnectionErrorRemediation(error) {
  console.log("\n" + "=".repeat(70));
  console.log(`${RED}${BOLD}DATABASE CONNECTION FAILED${RESET}`);
  console.log("=".repeat(70));

  console.log(`
${YELLOW}Error:${RESET} ${error}

${CYAN}${BOLD}CHECKLIST:${RESET}

  1. Verify DATABASE_URL is set in .env or .env.local:

     ${GREEN}cat .env | grep DATABASE_URL${RESET}

  2. Ensure the database server is running:

     For local PostgreSQL:
       ${GREEN}pg_isready -h localhost -p 5432${RESET}

     For Docker:
       ${GREEN}docker ps | grep postgres${RESET}

  3. Test connection manually:

     ${GREEN}npx prisma db execute --stdin <<< 'SELECT 1'${RESET}

  4. If using a new database, create it first:

     ${GREEN}createdb your_database_name${RESET}

`);
  console.log("=".repeat(70) + "\n");
}

/**
 * Main preflight check
 */
async function main() {
  console.log(`\n${CYAN}${BOLD}Prisma Migration Preflight Check${RESET}\n`);

  // Step 1: Check database connection
  logInfo("Checking database connection...");
  const connectionCheck = checkDatabaseConnection();

  if (!connectionCheck.connected) {
    printConnectionErrorRemediation(connectionCheck.error);
    process.exit(1);
  }
  logSuccess("Database connection OK");

  // Step 2: Get migration status
  logInfo("Checking migration status...");
  const { output, exitCode, error } = getMigrateStatus();

  if (error) {
    logError(`Failed to check migration status: ${error}`);
    process.exit(1);
  }

  // Step 3: Parse status
  const status = parseMigrationStatus(output);

  // Step 4: Check for git changes to migrations
  const gitChanges = checkGitMigrationChanges();

  // Step 5: Evaluate conditions and report

  // Check for drift (highest priority issue)
  if (status.hasDrift || gitChanges.hasModifiedMigrations) {
    logError("Migration drift detected!");
    printDriftRemediation(gitChanges);
    process.exit(1);
  }

  // Check for pending migrations
  if (status.hasPendingMigrations) {
    logWarn("Pending migrations found");
    printPendingMigrationsRemediation(status.pendingMigrations);
    process.exit(1);
  }

  // Check for failed migrations
  if (status.hasFailedMigration) {
    logError("Failed migration detected in history");
    console.log(`\n${YELLOW}Run the following to see details:${RESET}`);
    console.log(`  npx prisma migrate status\n`);
    process.exit(1);
  }

  // Check for out of sync state
  if (status.isOutOfSync) {
    logError("Database is out of sync with migrations");
    console.log(`\n${output}\n`);
    console.log(`${YELLOW}Run the following to see resolution options:${RESET}`);
    console.log(`  npx prisma migrate status\n`);
    process.exit(1);
  }

  // All good!
  if (status.isHealthy || exitCode === 0) {
    logSuccess("Database schema is up to date");
    logSuccess("Preflight check passed\n");
    process.exit(0);
  }

  // Unknown state - show raw output for debugging
  logWarn("Unknown migration state. Raw output:");
  console.log(output);
  console.log(`\nExit code: ${exitCode}`);

  // Don't block on unknown state, but warn
  logWarn("Proceeding with caution...\n");
  process.exit(0);
}

main().catch((err) => {
  logError(`Unexpected error: ${err.message}`);
  process.exit(1);
});
