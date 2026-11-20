// Generates prisma/schema.mysql.prisma from the SQLite schema used in local development.
// Hostinger hosting provides MySQL. MySQL maps a plain String to VARCHAR(191), too short for
// case content, transcripts and feedback, so every String that is not a key, unique or index
// column becomes MEDIUMTEXT. The models are otherwise identical.
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("prisma/schema.prisma", "utf8");
if (!src.includes('provider = "sqlite"')) throw new Error("prisma/schema.prisma: provider sqlite introuvable");

const out = [];
let block = [];
let inModel = false;

const flush = () => {
  // Columns that must stay VARCHAR: ids, @unique, relation scalars and @@index/@@unique members.
  const keep = new Set();
  for (const l of block) {
    for (const m of l.matchAll(/@@(?:unique|index)\(\[([^\]]+)\]/g)) m[1].split(",").forEach((f) => keep.add(f.trim()));
    for (const m of l.matchAll(/fields:\s*\[([^\]]+)\]/g)) m[1].split(",").forEach((f) => keep.add(f.trim()));
  }
  for (const l of block) {
    const m = l.match(/^(\s*)(\w+)(\s+)String(\??)(.*)$/);
    if (!m || /@id\b|@unique\b|@db\./.test(l) || keep.has(m[2])) {
      out.push(l);
      continue;
    }
    // MySQL cannot give TEXT columns a literal default: Prisma fills these defaults on create.
    const rest = m[5].replace(/@default\((".*?")\)/, "@default($1)");
    out.push(`${m[1]}${m[2]}${m[3]}String${m[4]} @db.MediumText${rest}`);
  }
  block = [];
};

for (const line of src.split("\n")) {
  if (/^model\s+\w+\s*\{/.test(line)) {
    inModel = true;
    out.push(line);
    continue;
  }
  if (inModel && /^\}/.test(line)) {
    flush();
    inModel = false;
    out.push(line);
    continue;
  }
  if (inModel) block.push(line);
  else out.push(line);
}

const schema = out.join("\n").replace('provider = "sqlite"', 'provider = "mysql"');
writeFileSync("prisma/schema.mysql.prisma", `// GÉNÉRÉ par scripts/mysql-schema.mjs — ne pas modifier à la main.\n${schema}`);
console.log("prisma/schema.mysql.prisma généré (MySQL)");
