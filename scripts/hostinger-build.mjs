// Hostinger build: MySQL schema → client → tables → case library → Next.js build.
// Hostinger writes DATABASE_URL with host "localhost"; Node.js must use 127.0.0.1
// ("localhost" can resolve to ::1, which the database user is not granted on).
import { execSync } from "node:child_process";

if (process.env.DATABASE_URL) process.env.DATABASE_URL = process.env.DATABASE_URL.replace("@localhost:", "@127.0.0.1:");

// Hostinger caps threads per account: keep Next.js on one CPU without worker threads.
process.env.LOW_RESOURCE_BUILD = "1";
// Hostinger runs the standalone server bundle Next.js emits with output: "standalone".
process.env.STANDALONE_BUILD = "1";

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
};

run("node scripts/mysql-schema.mjs");
run("npx prisma generate --schema prisma/schema.mysql.prisma");
run("npx prisma db push --schema prisma/schema.mysql.prisma --skip-generate");
run("npx tsx prisma/seed-prod.ts");
run("npx next build");

// The standalone bundle leaves static assets to the host: copy them in so
// .next/standalone/server.js serves CSS, JS chunks and public/ files on its own.
import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";
const dist = process.env.NEXT_DIST_DIR || ".next";
const standalone = join(dist, "standalone");
if (!existsSync(join(standalone, "server.js"))) throw new Error(`${standalone}/server.js introuvable : la compilation standalone a échoué`);
cpSync(join(dist, "static"), join(standalone, dist, "static"), { recursive: true });
cpSync("public", join(standalone, "public"), { recursive: true });
console.log(`✓ standalone prêt : ${standalone}/server.js (+ static, public)`);
