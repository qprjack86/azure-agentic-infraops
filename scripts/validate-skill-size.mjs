#!/usr/bin/env node
/**
 * Skill Size Validator
 *
 * Enforces context optimization rule: SKILL.md files over 200 lines
 * must have a `references/` directory for progressive loading.
 * Skills under the threshold are fine without references.
 *
 * @example
 * node scripts/validate-skill-size.mjs
 */

import fs from "node:fs";
import path from "node:path";

const SKILLS_DIR = ".github/skills";
const MAX_LINES_WITHOUT_REFS = 200;

let errors = 0;
let warnings = 0;
let checked = 0;

console.log("\n🔍 Skill Size Validator\n");

const skillDirs = fs
  .readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const skill of skillDirs) {
  const skillPath = path.join(SKILLS_DIR, skill, "SKILL.md");
  const refsDir = path.join(SKILLS_DIR, skill, "references");

  if (!fs.existsSync(skillPath)) continue;
  checked++;

  const content = fs.readFileSync(skillPath, "utf-8");
  const lineCount = content.split("\n").length;
  const hasRefs = fs.existsSync(refsDir);

  if (lineCount > MAX_LINES_WITHOUT_REFS && !hasRefs) {
    console.log(
      `::warning file=${skillPath}::${skill}/SKILL.md is ${lineCount} lines (>${MAX_LINES_WITHOUT_REFS}) without references/`,
    );
    console.log(
      `  Fix: Create ${refsDir}/ and move detailed content to reference files.`,
    );
    console.log(
      `  Keep SKILL.md as a ≤${MAX_LINES_WITHOUT_REFS}-line quick-reference with a Reference Index section.`,
    );
    warnings++;
  } else if (lineCount > MAX_LINES_WITHOUT_REFS && hasRefs) {
    const refCount = fs
      .readdirSync(refsDir)
      .filter((f) => f.endsWith(".md")).length;
    console.log(
      `  ⚠️  ${skill}/SKILL.md is ${lineCount} lines (>${MAX_LINES_WITHOUT_REFS}) but has ${refCount} reference files — consider trimming further`,
    );
    warnings++;
  } else {
    // Passes — no output needed
  }
}

console.log(`\n${"─".repeat(50)}`);
console.log(`Checked: ${checked} | Warnings: ${warnings} | Errors: ${errors}`);

if (errors > 0) {
  console.log(`\n❌ ${errors} skill size violation(s)`);
  process.exit(1);
}
console.log(`\n✅ Skill size check passed`);
