// IndexedDB storage for travel-photo binaries.
// Only Blobs live here. Photo metadata stays in profileStorage (localStorage).
// Every function returns a Result and never throws, so the UI can show errors with Retry.

import {
  PROFILE_DB_NAME,
  PROFILE_DB_VERSION,
  PHOTO_STORE_NAME,
  Result,
  ok,
  fail,
} from './types';

interface StoredPhoto {
  id: string;
  blob: Blob;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function describeError(err: unknown): string {
  if (err instanceof DOMException && err.name === 'QuotaExceededError') {
    return 'Not enough browser storage space for these photos.';
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Photo storage failed. Please try again.';
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  const promise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Photo storage (IndexedDB) is not available in this browser.'));
      return;
    }

    const request = indexedDB.open(PROFILE_DB_NAME, PROFILE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
        db.createObjectStore(PHOTO_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // Let the next call reopen the database if it is closed or upgraded elsewhere.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Could not open photo storage.'));
    };

    request.onblocked = () => {
      reject(new Error('Photo storage is blocked by another open tab. Close other tabs and retry.'));
    };
  });

  dbPromise = promise;
  promise.catch(() => {
    if (dbPromise === promise) dbPromise = null;
  });
  return promise;
}

// Runs one transaction. It resolves only when the transaction commits,
// so a quota error at commit time is reported as a failure, never as success.
async function runTransaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore, setResult: (value: T) => void) => void,
): Promise<T> {
  const db = await openDb();

  return new Promise<T>((resolve, reject) => {
    let result: T | undefined;
    try {
      const tx = db.transaction(PHOTO_STORE_NAME, mode);
      tx.oncomplete = () => resolve(result as T);
      tx.onerror = () => reject(tx.error ?? new Error('Photo storage operation failed.'));
      tx.onabort = () => reject(tx.error ?? new Error('Photo storage operation was cancelled.'));
      work(tx.objectStore(PHOTO_STORE_NAME), (value) => {
        result = value;
      });
    } catch (err) {
      dbPromise = null; // the connection may be stale; reopen next time
      reject(err);
    }
  });
}

// ---------- Write ----------

// Saves all photos in ONE transaction: either every photo is stored or none is.
export async function savePhotoBlobs(
  entries: { id: string; blob: Blob }[],
): Promise<Result<void>> {
  if (entries.length === 0) return ok(undefined);
  try {
    await runTransaction<void>('readwrite', (store) => {
      for (const entry of entries) {
        const item: StoredPhoto = { id: entry.id, blob: entry.blob };
        store.put(item);
      }
    });
    return ok(undefined);
  } catch (err) {
    console.error('Failed to save photos to IndexedDB:', err);
    return fail(describeError(err));
  }
}

// Permanently deletes photo binaries. Ids that do not exist are ignored.
export async function deletePhotoBlobs(ids: string[]): Promise<Result<void>> {
  if (ids.length === 0) return ok(undefined);
  try {
    await runTransaction<void>('readwrite', (store) => {
      for (const id of ids) store.delete(id);
    });
    return ok(undefined);
  } catch (err) {
    console.error('Failed to delete photos from IndexedDB:', err);
    return fail(describeError(err));
  }
}

// Permanently deletes every photo binary. Used only by Reset Profile / Empty Recycle Bin flows.
export async function clearAllPhotoBlobs(): Promise<Result<void>> {
  try {
    await runTransaction<void>('readwrite', (store) => {
      store.clear();
    });
    return ok(undefined);
  } catch (err) {
    console.error('Failed to clear photo storage:', err);
    return fail(describeError(err));
  }
}

// ---------- Read ----------

// Returns a map of id -> Blob. Missing photos are simply absent from the map,
// so callers can report exactly which photos could not be found.
export async function loadPhotoBlobs(ids: string[]): Promise<Result<Map<string, Blob>>> {
  const found = new Map<string, Blob>();
  if (ids.length === 0) return ok(found);
  try {
    await runTransaction<void>('readonly', (store) => {
      for (const id of ids) {
        const request = store.get(id);
        request.onsuccess = () => {
          const item = request.result as StoredPhoto | undefined;
          if (item && item.blob instanceof Blob) found.set(id, item.blob);
        };
      }
    });
    return ok(found);
  } catch (err) {
    console.error('Failed to read photos from IndexedDB:', err);
    return fail(describeError(err));
  }
}

export async function loadPhotoBlob(id: string): Promise<Result<Blob | null>> {
  const result = await loadPhotoBlobs([id]);
  if (!result.ok) return result;
  return ok(result.value.get(id) ?? null);
}

// Returns which of the given ids exist, without reading the image data.
export async function findExistingPhotoIds(ids: string[]): Promise<Result<Set<string>>> {
  const existing = new Set<string>();
  if (ids.length === 0) return ok(existing);
  try {
    await runTransaction<void>('readonly', (store) => {
      for (const id of ids) {
        const request = store.getKey(id);
        request.onsuccess = () => {
          if (request.result !== undefined) existing.add(id);
        };
      }
    });
    return ok(existing);
  } catch (err) {
    console.error('Failed to check photos in IndexedDB:', err);
    return fail(describeError(err));
  }
}

// Lists every stored photo id (useful for finding orphaned photos).
export async function listStoredPhotoIds(): Promise<Result<string[]>> {
  try {
    const ids = await runTransaction<string[]>('readonly', (store, setResult) => {
      const request = store.getAllKeys();
      request.onsuccess = () => setResult(request.result.map((key) => String(key)));
    });
    return ok(ids ?? []);
  } catch (err) {
    console.error('Failed to list photos in IndexedDB:', err);
    return fail(describeError(err));
  }
}

// ---------- Storage availability ----------

export interface StorageEstimate {
  usageBytes: number;
  quotaBytes: number;
}

// Returns null when the browser cannot report storage usage.
export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  try {
    if (!navigator.storage || typeof navigator.storage.estimate !== 'function') return null;
    const estimate = await navigator.storage.estimate();
    if (estimate.usage === undefined || estimate.quota === undefined) return null;
    return { usageBytes: estimate.usage, quotaBytes: estimate.quota };
  } catch {
    return null;
  }
}

// Pre-check before saving photos. If the browser cannot report usage, we allow the
// attempt; savePhotoBlobs still reports a real failure if the write does not fit.
export async function hasRoomFor(bytesNeeded: number): Promise<boolean> {
  const estimate = await getStorageEstimate();
  if (!estimate) return true;
  return estimate.quotaBytes - estimate.usageBytes >= bytesNeeded;
}