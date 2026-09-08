import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SharedResource = "family" | "memory-book" | "medication" | "routine";

type SharedData = Record<SharedResource, unknown[]>;

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "calm-companion.json");
let pendingWrite: Promise<void> = Promise.resolve();

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

async function withWriteLock<T>(operation: () => Promise<T>) {
  const previousWrite = pendingWrite;
  let releaseWrite!: () => void;
  pendingWrite = new Promise<void>((resolve) => {
    releaseWrite = resolve;
  });

  await previousWrite;
  try {
    return await operation();
  } finally {
    releaseWrite();
  }
}

export async function getSharedItems(resource: SharedResource) {
  const data = await readSharedData();
  return data[resource];
}

export async function replaceSharedItems(resource: SharedResource, items: unknown[]) {
  return withWriteLock(async () => {
    const data = await readSharedData();
    data[resource] = items;
    await writeSharedData(data);
    return items;
  });
}

export async function migrateSharedItems(resource: SharedResource, items: unknown[]) {
  return withWriteLock(async () => {
    const data = await readSharedData();

    if (data[resource].length > 0) {
      return data[resource];
    }

    data[resource] = items;
    await writeSharedData(data);
    return items;
  });
}