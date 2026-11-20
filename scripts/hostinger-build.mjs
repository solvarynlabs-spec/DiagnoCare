// Hostinger build: MySQL schema → client → tables → case library → Next.js build.
// Hostinger writes DATABASE_URL with host "localhost"; Node.js must use 127.0.0.1
// ("localhost" can resolve to ::1, which the database user is not granted on).
import { execSync } from "node:child_process";

if (process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.DATABASE_URL.replace("@localhost:", "@127.0.0.1:");

// Hostinger caps threads per account: keep Next.js on one CPU without worker threads.
process.env.LOW_RESOURCE_BUILD = "1";

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
};

run("node scripts/mysql-schema.mjs");
run("npx prisma generate --schema prisma/schema.mysql.prisma");
run("npx prisma db push --schema prisma/schema.mysql.prisma --skip-generate");
run("npx tsx prisma/seed-prod.ts");
run("npx next build");
