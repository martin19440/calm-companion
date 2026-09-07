export type SharedResource = "family" | "memory-book" | "medication" | "routine";

export async function loadSharedItems<T>(resource: SharedResource, storageKey: string): Promise<T[]> {
  const response = await fetch(`/api/data/${resource}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Unable to load ${resource} data.`);
  }

  const serverItems = (await response.json()) as T[];

  if (serverItems.length > 0) {
    return serverItems;
  }

  const localValue = window.localStorage.getItem(storageKey);
  if (!localValue) {
    return serverItems;
  }

  try {
    const localItems = JSON.parse(localValue) as T[];
    if (!Array.isArray(localItems) || localItems.length === 0) {
      return serverItems;
    }

    const migrationResponse = await fetch(`/api/data/${resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(localItems),
    });

    if (!migrationResponse.ok) {
      throw new Error(`Unable to migrate ${resource} data.`);
    }

    return (await migrationResponse.json()) as T[];
  } catch {
    return serverItems;
  }
}

export async function saveSharedItems<T>(resource: SharedResource, items: T[]) {
  const response = await fetch(`/api/data/${resource}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items),
  });

  if (!response.ok) {
    throw new Error(`Unable to save ${resource} data.`);
  }
}