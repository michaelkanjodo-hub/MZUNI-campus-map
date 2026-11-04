const DATABASE_NAME = 'mzuni-campus';
const STORE_NAME = 'snapshots';
const CAMPUS_KEY = 'campus-data';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB is unavailable'));
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, operation) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export async function saveCampusSnapshot(campus) {
  try {
    await withStore('readwrite', (store) => store.put(campus, CAMPUS_KEY));
  } catch {
    try { localStorage.setItem('mzuni-campus-fallback', JSON.stringify(campus)); } catch { /* no-op */ }
  }
}

export async function readCampusSnapshot() {
  try {
    const value = await withStore('readonly', (store) => store.get(CAMPUS_KEY));
    if (value) return value;
  } catch { /* try the small-storage fallback below */ }
  try {
    return JSON.parse(localStorage.getItem('mzuni-campus-fallback'));
  } catch {
    return null;
  }
}
