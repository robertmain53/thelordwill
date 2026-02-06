import fs from "node:fs";
import path from "node:path";

export type BlueprintRecord = {
  id: string;
  blueprintId: string;
  type: string;
  title: string;
  description: string;
  content: string;
  links?: string[];
  policyFailures?: string[];
};

const BLUEPRINT_DIR = path.join(process.cwd(), "blueprints");
let blueprintCache: BlueprintRecord[] | null = null;

function loadBlueprints(): BlueprintRecord[] {
  if (blueprintCache) {
    return blueprintCache;
  }

  if (!fs.existsSync(BLUEPRINT_DIR)) {
    blueprintCache = [];
    return blueprintCache;
  }

  const files = fs.readdirSync(BLUEPRINT_DIR);
  const blueprints: BlueprintRecord[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = fs.readFileSync(path.join(BLUEPRINT_DIR, file), "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.blueprintId) {
        blueprints.push(parsed);
      }
    } catch (error) {
      console.error("Failed to load blueprint", file, error);
    }
  }

  blueprintCache = blueprints;
  return blueprintCache;
}

export function getBlueprints(): BlueprintRecord[] {
  return loadBlueprints();
}

export function findBlueprintById(blueprintId: string): BlueprintRecord | undefined {
  return loadBlueprints().find((bp) => bp.blueprintId === blueprintId);
}

export function getBlueprintForRoute(
  type: string,
  slug: string,
  locale: string,
): BlueprintRecord | undefined {
  const normalizedLocale = locale || "en";
  const key = `${type}/${slug}-${normalizedLocale}`;
  return findBlueprintById(key);
}
