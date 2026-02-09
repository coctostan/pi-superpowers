import { readdir, readFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, test, expect, beforeAll } from "vitest";

const ROOT_DIR = resolve(__dirname, "../..");
const SKILLS_DIR = join(ROOT_DIR, "skills");
const PACKAGE_JSON = join(ROOT_DIR, "package.json");

// --- Helpers ---

interface SkillFrontmatter {
  name?: string;
  description?: string;
  [key: string]: string | undefined;
}

function parseFrontmatter(content: string): SkillFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const lines = match[1].split("\n");
  const result: SkillFrontmatter = {};
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) result[key] = value;
  }
  return result;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function getSkillDirs(): Promise<string[]> {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

// --- State ---

let skillDirs: string[] = [];
let skillContents: Map<string, string> = new Map();
let packageJson: any = {};

beforeAll(async () => {
  skillDirs = await getSkillDirs();
  for (const dir of skillDirs) {
    const skillPath = join(SKILLS_DIR, dir, "SKILL.md");
    if (await fileExists(skillPath)) {
      skillContents.set(dir, await readFile(skillPath, "utf-8"));
    }
  }
  packageJson = JSON.parse(await readFile(PACKAGE_JSON, "utf-8"));
});

// --- Frontmatter Validation ---

describe("skill frontmatter validation", () => {
  test("every skill directory has a SKILL.md file", async () => {
    for (const dir of skillDirs) {
      const exists = await fileExists(join(SKILLS_DIR, dir, "SKILL.md"));
      expect(exists, `${dir}/SKILL.md should exist`).toBe(true);
    }
  });

  test("every skill has valid YAML frontmatter with --- delimiters", () => {
    for (const dir of skillDirs) {
      const content = skillContents.get(dir);
      expect(content, `${dir} should have content`).toBeDefined();
      const fm = parseFrontmatter(content!);
      expect(fm, `${dir}/SKILL.md should have valid frontmatter`).not.toBeNull();
    }
  });

  test('every skill has a "name" field', () => {
    for (const dir of skillDirs) {
      const fm = parseFrontmatter(skillContents.get(dir)!);
      expect(fm?.name, `${dir} should have a name field`).toBeDefined();
      expect(fm!.name!.length, `${dir} name should be non-empty`).toBeGreaterThan(0);
    }
  });

  test("name matches parent directory name", () => {
    for (const dir of skillDirs) {
      const fm = parseFrontmatter(skillContents.get(dir)!);
      expect(fm?.name, `${dir} name should match directory`).toBe(dir);
    }
  });

  test("name is lowercase, a-z, 0-9, hyphens only", () => {
    for (const dir of skillDirs) {
      const fm = parseFrontmatter(skillContents.get(dir)!);
      expect(
        fm!.name,
        `${dir} name should match pattern`
      ).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
    }
  });

  test("name is ≤ 64 characters", () => {
    for (const dir of skillDirs) {
      const fm = parseFrontmatter(skillContents.get(dir)!);
      expect(
        fm!.name!.length,
        `${dir} name should be ≤ 64 chars`
      ).toBeLessThanOrEqual(64);
    }
  });

  test('every skill has a "description" field', () => {
    for (const dir of skillDirs) {
      const fm = parseFrontmatter(skillContents.get(dir)!);
      expect(fm?.description, `${dir} should have a description`).toBeDefined();
    }
  });

  test("description is non-empty", () => {
    for (const dir of skillDirs) {
      const fm = parseFrontmatter(skillContents.get(dir)!);
      expect(
        fm!.description!.length,
        `${dir} description should be non-empty`
      ).toBeGreaterThan(0);
    }
  });

  test("description is ≤ 1024 characters", () => {
    for (const dir of skillDirs) {
      const fm = parseFrontmatter(skillContents.get(dir)!);
      expect(
        fm!.description!.length,
        `${dir} description should be ≤ 1024 chars`
      ).toBeLessThanOrEqual(1024);
    }
  });
});

// --- Cross-References ---

describe("skill cross-references", () => {
  test("every /skill:name reference points to an existing skill directory", () => {
    for (const dir of skillDirs) {
      const content = skillContents.get(dir)!;
      const refs = content.match(/\/skill:([a-z0-9-]+)/g) ?? [];
      for (const ref of refs) {
        const skillName = ref.replace("/skill:", "");
        expect(
          skillDirs,
          `${dir} references /skill:${skillName} which should exist`
        ).toContain(skillName);
      }
    }
  });

  test("no broken cross-references across all skills", () => {
    const allRefs: { from: string; to: string }[] = [];
    for (const dir of skillDirs) {
      const content = skillContents.get(dir)!;
      const refs = content.match(/\/skill:([a-z0-9-]+)/g) ?? [];
      for (const ref of refs) {
        allRefs.push({ from: dir, to: ref.replace("/skill:", "") });
      }
    }
    const broken = allRefs.filter((r) => !skillDirs.includes(r.to));
    expect(
      broken,
      `Broken references: ${broken.map((b) => `${b.from} → ${b.to}`).join(", ")}`
    ).toEqual([]);
  });
});

// --- File References ---

describe("skill file references", () => {
  test("every referenced .md file exists in the skill directory", async () => {
    for (const dir of skillDirs) {
      const content = skillContents.get(dir)!;
      // Match markdown-style references to .md files (not URLs, not /skill: refs)
      // Look for patterns like: [text](filename.md) or references to filename.md
      const linkRefs = [...content.matchAll(/\[.*?\]\(([^)]+\.md)\)/g)].map((m) => m[1]);
      for (const ref of linkRefs) {
        // Skip URLs
        if (ref.startsWith("http://") || ref.startsWith("https://")) continue;
        const fullPath = join(SKILLS_DIR, dir, ref);
        const exists = await fileExists(fullPath);
        expect(exists, `${dir} references ${ref} which should exist`).toBe(true);
      }
    }
  });

  test("every referenced .sh file exists in the skill directory", async () => {
    for (const dir of skillDirs) {
      const content = skillContents.get(dir)!;
      const linkRefs = [...content.matchAll(/\[.*?\]\(([^)]+\.sh)\)/g)].map((m) => m[1]);
      // Also look for backtick references like `filename.sh`
      const backtickRefs = [...content.matchAll(/`([^`\s]+\.sh)`/g)].map((m) => m[1]);
      const allRefs = [...new Set([...linkRefs, ...backtickRefs])];
      for (const ref of allRefs) {
        if (ref.startsWith("http://") || ref.startsWith("https://")) continue;
        // Skip refs that look like commands rather than filenames
        if (ref.includes("/") && !ref.startsWith("./") && !ref.startsWith("../")) continue;
        const fullPath = join(SKILLS_DIR, dir, ref);
        const exists = await fileExists(fullPath);
        expect(exists, `${dir} references ${ref} which should exist`).toBe(true);
      }
    }
  });

  test("every referenced .ts file exists in the skill directory", async () => {
    for (const dir of skillDirs) {
      const content = skillContents.get(dir)!;
      const linkRefs = [...content.matchAll(/\[.*?\]\(([^)]+\.ts)\)/g)].map((m) => m[1]);
      const backtickRefs = [...content.matchAll(/`([^`\s]+\.ts)`/g)].map((m) => m[1]);
      const allRefs = [...new Set([...linkRefs, ...backtickRefs])];
      for (const ref of allRefs) {
        if (ref.startsWith("http://") || ref.startsWith("https://")) continue;
        if (ref.includes("/") && !ref.startsWith("./") && !ref.startsWith("../")) continue;
        const fullPath = join(SKILLS_DIR, dir, ref);
        const exists = await fileExists(fullPath);
        expect(exists, `${dir} references ${ref} which should exist`).toBe(true);
      }
    }
  });
});

// --- Structural Checks ---

describe("package.json structure", () => {
  test('pi.skills includes "skills" directory', () => {
    expect(packageJson.pi?.skills).toBeDefined();
    expect(packageJson.pi.skills).toContain("skills");
  });

  test('pi.extensions includes "extensions/plan-tracker.ts"', () => {
    expect(packageJson.pi?.extensions).toBeDefined();
    expect(packageJson.pi.extensions).toContain("extensions/plan-tracker.ts");
  });

  test("every skill directory is reachable from pi.skills path", async () => {
    const skillsPaths: string[] = packageJson.pi?.skills ?? [];
    // Collect all skill dirs reachable from declared paths
    const reachable = new Set<string>();
    for (const sp of skillsPaths) {
      const fullPath = join(ROOT_DIR, sp);
      if (await fileExists(fullPath)) {
        const entries = await readdir(fullPath, { withFileTypes: true });
        for (const e of entries) {
          if (e.isDirectory()) reachable.add(e.name);
        }
      }
    }
    for (const dir of skillDirs) {
      expect(
        reachable.has(dir),
        `${dir} should be reachable from pi.skills paths`
      ).toBe(true);
    }
  });
});

describe("consistency checks", () => {
  test("no orphan skill directories", async () => {
    const skillsPaths: string[] = packageJson.pi?.skills ?? [];
    const reachable = new Set<string>();
    for (const sp of skillsPaths) {
      const fullPath = join(ROOT_DIR, sp);
      if (await fileExists(fullPath)) {
        const entries = await readdir(fullPath, { withFileTypes: true });
        for (const e of entries) {
          if (e.isDirectory()) reachable.add(e.name);
        }
      }
    }
    const orphans = skillDirs.filter((d) => !reachable.has(d));
    expect(
      orphans,
      `Orphan skill directories: ${orphans.join(", ")}`
    ).toEqual([]);
  });

  test("no duplicate skill names across directories", () => {
    const names: string[] = [];
    for (const dir of skillDirs) {
      const fm = parseFrontmatter(skillContents.get(dir)!);
      if (fm?.name) names.push(fm.name);
    }
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    expect(
      duplicates,
      `Duplicate skill names: ${duplicates.join(", ")}`
    ).toEqual([]);
  });
});
