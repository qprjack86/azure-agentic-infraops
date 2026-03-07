#!/usr/bin/env node
/**
 * Instruction Reference Validator
 *
 * Scans agents, skills, and instructions for cross-references
 * and validates that referenced files exist within the repo.
 *
 * Validation rules:
 * 1. Every `Read .github/instructions/X` reference → file X must exist
 * 2. Every `applyTo` glob pattern → at least 1 matching file should exist
 * 3. Every `Read .github/skills/X/SKILL.md` reference → skill dir and SKILL.md must exist
 *
 * @example
 * node scripts/validate-instruction-references.mjs
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

let errors = 0;
let warnings = 0;
let checks = 0;

function check(description, condition, severity = "error") {
  checks++;
  if (condition) {
    console.log(`  ✅ ${description}`);
  } else if (severity === "warn") {
    console.log(`  ⚠️  ${description}`);
    warnings++;
  } else {
    console.log(`  ❌ ${description}`);
    errors++;
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.resolve(ROOT, relPath));
}

function collectFiles(dirs, extensions) {
  const files = [];
  const excludedDirs = new Set([".git", ".venv", "node_modules", "dist", "build"]);

  function walk(dirPath) {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (!excludedDirs.has(entry.name)) {
          walk(fullPath);
        }
        continue;
      }

      if (
        entry.isFile() &&
        extensions.some((ext) => entry.name.endsWith(ext))
      ) {
        files.push(fullPath);
      }
    }
  }

  for (const dir of dirs) {
    const absDir = path.resolve(ROOT, dir);
    if (!fs.existsSync(absDir)) continue;
    walk(absDir);
  }
  return files;
}

function escapeRegex(text) {
  return text.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegex(pattern) {
  let regex = "";
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i];
    const next = pattern[i + 1];

    if (ch === "*") {
      if (next === "*") {
        const afterNext = pattern[i + 2];
        // `**/` can match zero or more directories.
        if (afterNext === "/") {
          regex += "(?:.*/)?";
          i += 3;
        } else {
          regex += ".*";
          i += 2;
        }
      } else {
        regex += "[^/]*";
        i += 1;
      }
      continue;
    }

    if (ch === "?") {
      regex += "[^/]";
      i += 1;
      continue;
    }

    if (ch === "{") {
      const close = pattern.indexOf("}", i + 1);
      if (close !== -1) {
        const choices = pattern
          .slice(i + 1, close)
          .split(",")
          .map((choice) => escapeRegex(choice.trim()))
          .filter(Boolean);
        if (choices.length > 0) {
          regex += `(?:${choices.join("|")})`;
          i = close + 1;
          continue;
        }
      }
    }

    regex += escapeRegex(ch);
    i += 1;
  }

  return new RegExp(`^${regex}$`);
}

let repoFilesCache = null;

function listRepoFiles() {
  if (repoFilesCache) return repoFilesCache;

  const excludedDirs = new Set([".git", ".venv", "node_modules", "dist", "build"]);
  const files = [];

  function walk(dirPath) {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (!excludedDirs.has(entry.name)) {
          walk(fullPath);
        }
        continue;
      }
      if (entry.isFile()) {
        files.push(path.relative(ROOT, fullPath).replaceAll(path.sep, "/"));
      }
    }
  }

  walk(ROOT);
  repoFilesCache = files;
  return repoFilesCache;
}

/**
 * Splits a comma-separated `applyTo` glob string into individual patterns,
 * respecting brace expressions such as `path/{bicep,tf}` where the comma is
 * part of the glob syntax and must NOT be treated as a delimiter.
 *
 * Brace depth is tracked so that commas inside `{...}` are preserved as-is,
 * while top-level commas (depth === 0) are used as split points.
 *
 * @param {string} pattern - Raw `applyTo` value from instruction frontmatter.
 * @returns {string[]} Array of trimmed, non-empty glob patterns.
 */
function splitApplyTo(pattern) {
  // Split on commas that are NOT inside brace expressions {a,b,c}
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of pattern) {
    if (ch === "{") {
      depth++;
      current += ch;
    } else if (ch === "}") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts.filter(Boolean);
}

/**
 * Returns true if at least one file in the workspace matches the given glob
 * pattern (or any of the comma-separated patterns it contains).
 *
 * In addition to the patterns as written, hidden-directory variants are
 * automatically derived for `**`-prefixed patterns — e.g. `**\/*.bicep` maps
 * to `.github/**\/*.bicep` and `.vscode/**\/*.bicep` — because
 * `globSync` skips dot-prefixed directories by default and would otherwise
 * miss files that live exclusively inside `.github` or `.vscode`.
 *
 * @param {string} pattern - Raw `applyTo` value, may be comma-separated.
 * @returns {boolean} True if any matching file exists; false otherwise.
 */
function globHasMatch(pattern) {
  const patterns = splitApplyTo(pattern);
  // Also derive hidden-dir variants: "**/*.foo" → ".github/**/*.foo" etc.
  const hiddenPrefixes = [".github", ".vscode"];
  const expanded = [];
  for (const pat of patterns) {
    expanded.push(pat);
    if (pat.startsWith("**/")) {
      for (const prefix of hiddenPrefixes) {
        expanded.push(`${prefix}/**/${pat.slice(3)}`);
      }
    }
  }
  try {
    const files = listRepoFiles();
    const regexes = expanded.map(globToRegex);
    return files.some((file) => regexes.some((rx) => rx.test(file)));
  } catch {
    return false;
  }
}

// --- Rule 1: Instruction file references ---

console.log("\n🔍 Instruction Reference Validator\n");
console.log("─".repeat(60));
console.log("📄 Rule 1: Instruction file references exist\n");

const scanDirs = [
  ".github/agents",
  ".github/skills",
  ".github/instructions",
  ".github/prompts",
];
const scanExts = [".md"];
const allMdFiles = collectFiles(scanDirs, scanExts);

const instructionRefPattern =
  /[Rr]ead\s+[`"]?\.github\/instructions\/([^`"\s)]+)[`"]?/g;

const foundInstructionRefs = new Map();

for (const filePath of allMdFiles) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relFile = path.relative(ROOT, filePath);
  let match;

  instructionRefPattern.lastIndex = 0;
  while ((match = instructionRefPattern.exec(content)) !== null) {
    const refFile = `.github/instructions/${match[1]}`;
    if (!foundInstructionRefs.has(refFile)) {
      foundInstructionRefs.set(refFile, []);
    }
    foundInstructionRefs.get(refFile).push(relFile);
  }
}

for (const [refFile, sources] of foundInstructionRefs) {
  check(
    `${refFile} (referenced by ${sources.length} file(s))`,
    fileExists(refFile),
  );
}

if (foundInstructionRefs.size === 0) {
  console.log("  ℹ️  No instruction references found in scanned files");
}

// --- Rule 2: applyTo globs have matching files ---

console.log("\n" + "─".repeat(60));
console.log("📄 Rule 2: applyTo glob patterns have matching files\n");

const instructionFiles = collectFiles(
  [".github/instructions"],
  [".instructions.md"],
);

for (const filePath of instructionFiles) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relFile = path.relative(ROOT, filePath);
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;

  const applyToMatch = fmMatch[1].match(/applyTo:\s*['"]?([^'"\n]+)['"]?/);
  if (!applyToMatch) continue;

  const applyTo = applyToMatch[1].trim();

  // Skip wildcard patterns that match everything
  if (applyTo === "**" || applyTo === "*") {
    console.log(
      `  ℹ️  ${path.basename(relFile)}: applyTo="${applyTo}" (universal — skipped)`,
    );
    continue;
  }

  const hasMatch = globHasMatch(applyTo);
  check(
    `${path.basename(relFile)}: applyTo="${applyTo}" has matching files`,
    hasMatch,
    "warn",
  );
}

// --- Rule 3: Skill references exist ---

console.log("\n" + "─".repeat(60));
console.log("📄 Rule 3: Skill SKILL.md references exist\n");

const skillRefPattern =
  /[Rr]ead\s+[`"]?\.github\/skills\/([^/`"\s]+)\/SKILL\.md[`"]?/g;

const foundSkillRefs = new Map();

for (const filePath of allMdFiles) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relFile = path.relative(ROOT, filePath);
  let match;

  skillRefPattern.lastIndex = 0;
  while ((match = skillRefPattern.exec(content)) !== null) {
    const skillDir = `.github/skills/${match[1]}`;
    const skillFile = `${skillDir}/SKILL.md`;
    if (!foundSkillRefs.has(skillFile)) {
      foundSkillRefs.set(skillFile, []);
    }
    foundSkillRefs.get(skillFile).push(relFile);
  }
}

for (const [skillFile, sources] of foundSkillRefs) {
  check(
    `${skillFile} (referenced by ${sources.length} file(s))`,
    fileExists(skillFile),
  );
}

if (foundSkillRefs.size === 0) {
  console.log("  ℹ️  No skill references found in scanned files");
}

// --- Also check for cross-references between instruction files ---

console.log("\n" + "─".repeat(60));
console.log("📄 Rule 4: Cross-references between instruction files\n");

const crossRefPattern = /[`"]?([a-z][\w-]+\.instructions\.md)[`"]?/g;

// Patterns commonly used as examples, not real references
const EXAMPLE_PATTERNS = ["react-best-practices.instructions.md"];

function stripCodeBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, "");
}

const crossRefs = new Map();

for (const filePath of allMdFiles) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  const content = stripCodeBlocks(rawContent);
  const relFile = path.relative(ROOT, filePath);
  let match;

  crossRefPattern.lastIndex = 0;
  while ((match = crossRefPattern.exec(content)) !== null) {
    const refName = match[1];
    if (EXAMPLE_PATTERNS.includes(refName)) continue;
    const refPath = `.github/instructions/${refName}`;
    // Skip self-references
    if (relFile.endsWith(refName)) continue;
    if (!crossRefs.has(refPath)) {
      crossRefs.set(refPath, new Set());
    }
    crossRefs.get(refPath).add(relFile);
  }
}

for (const [refPath, sources] of crossRefs) {
  check(
    `${refPath} (cross-referenced by ${sources.size} file(s))`,
    fileExists(refPath),
  );
}

if (crossRefs.size === 0) {
  console.log("  ℹ️  No cross-references found");
}

// --- Summary ---

console.log(`\n${"═".repeat(60)}`);
console.log(`Checks: ${checks} | Errors: ${errors} | Warnings: ${warnings}`);

if (errors > 0) {
  console.log(`\n❌ ${errors} broken reference(s) found`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\n⚠️  Passed with ${warnings} warning(s)`);
} else {
  console.log(`\n✅ All instruction references valid`);
}
