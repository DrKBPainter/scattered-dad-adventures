#!/usr/bin/env node
/**
 * tools_scan_bugs.js — scan source files for TODO / FIXME / HACK / BUG comments
 * and log any that aren't already tracked in bugs/BUG_LOG.md.
 *
 * Usage:
 *   node tools/tools_scan_bugs.js [--dry-run]
 *
 * Scans: js/*.js  (add more globs below if needed)
 * Writes: one BUG entry per untracked inline comment, status = open
 */

"use strict";
const fs    = require("fs");
const path  = require("path");
const { execSync } = require("child_process");

const DRY = process.argv.includes("--dry-run");

// ── locate project root ───────────────────────────────────────────────────────
const projectRoot = path.resolve(__dirname, "..");
const logPath     = path.join(projectRoot, "bugs", "BUG_LOG.md");

if (!fs.existsSync(logPath)) {
  console.error("bugs/BUG_LOG.md not found. Run from project root.");
  process.exit(1);
}

const logContent = fs.readFileSync(logPath, "utf8");

// ── files to scan ─────────────────────────────────────────────────────────────
const SOURCE_DIRS  = ["js"];
const SOURCE_EXT   = ".js";
const SCAN_RE      = /\/\/\s*(TODO|FIXME|HACK|BUG)[:\s]+(.+)/gi;

function collectSourceFiles() {
  const files = [];
  for (const dir of SOURCE_DIRS) {
    const abs = path.join(projectRoot, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      if (f.endsWith(SOURCE_EXT)) files.push(path.join(dir, f));
    }
  }
  return files;
}

// ── scan ──────────────────────────────────────────────────────────────────────
const hits = [];

for (const relFile of collectSourceFiles()) {
  const abs  = path.join(projectRoot, relFile);
  const lines = fs.readFileSync(abs, "utf8").split("\n");
  lines.forEach((line, i) => {
    SCAN_RE.lastIndex = 0;
    const m = SCAN_RE.exec(line);
    if (!m) return;
    const kind  = m[1].toUpperCase();
    const msg   = m[2].trim();
    // dedupe: skip if this exact message is already in the log
    if (logContent.includes(msg)) return;
    hits.push({ file: relFile, line: i + 1, kind, msg });
  });
}

if (hits.length === 0) {
  console.log("No untracked TODO/FIXME/HACK/BUG comments found.");
  process.exit(0);
}

console.log(`Found ${hits.length} untracked comment(s):`);
hits.forEach(h => console.log(`  [${h.kind}] ${h.file}:${h.line} — ${h.msg}`));

if (DRY) {
  console.log("\n--dry-run: no entries written.");
  process.exit(0);
}

// ── log each hit ──────────────────────────────────────────────────────────────
const logScript = path.join(projectRoot, "tools", "tools_log_bug.js");

for (const h of hits) {
  const args = [
    `--title`,  `${h.kind}: ${h.msg.slice(0, 72)}`,
    `--desc`,   `Inline ${h.kind} comment at ${h.file} line ${h.line}: ${h.msg}`,
    `--file`,   h.file,
    `--status`, "open",
  ].map(a => JSON.stringify(a)).join(" ");
  const cmd = `node ${JSON.stringify(logScript)} ${args}`;
  execSync(cmd, { cwd: projectRoot, stdio: "inherit" });
}

console.log(`\nLogged ${hits.length} bug(s) to bugs/BUG_LOG.md`);
