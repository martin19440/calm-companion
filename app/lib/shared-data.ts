import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SharedResource = "family" | "memory-book" | "medication" | "routine";

type SharedData = Record<SharedResource, unknown[]>;

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "calm-companion.json");

const emptyData: SharedData = {
  family: [],
  "memory-book": [],
  medication: [],
  routine: [],
};

async function readSharedData(): Promise<SharedData> {
  try {
    const contents = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(contents) as Partial<SharedData>;

    return {
      family: Array.isArray(parsed.family) ? parsed.family : [],
      "memory-book": Array.isArray(parsed["memory-book"]) ? parsed["memory-book"] : [],
      medication: Array.isArray(parsed.medication) ? parsed.medication : [],
      routine: Array.isArray(parsed.routine) ? parsed.routine : [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    return emptyData;
  }
}

async function writeSharedData(data: SharedData) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function getSharedItems(resource: SharedResource) {
  const data = await readSharedData();
  return data[resource];
}

export async function replaceSharedItems(resource: SharedResource, items: unknown[]) {
  const data = await readSharedData();
  data[resource] = items;
  await writeSharedData(data);
  return items;
}

export async function migrateSharedItems(resource: SharedResource, items: unknown[]) {
  const data = await readSharedData();

  if (data[resource].length > 0) {
    return data[resource];
  }

  data[resource] = items;
  await writeSharedData(data);
  return items;
}
