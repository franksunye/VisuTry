const DATABASE_NAME = 'visutry-local-handoffs'
const DATABASE_VERSION = 1
const PHOTO_STORE = 'face-analysis-photos'
const HANDOFF_TTL_MS = 30 * 60 * 1000

interface StoredPhotoHandoff {
  id: string
  blob: Blob
  name: string
  type: string
  lastModified: number
  expiresAt: number
}

function getIndexedDb(): IDBFactory {
  if (typeof window === 'undefined' || !window.indexedDB) {
    throw new Error('Local photo handoff is unavailable in this browser')
  }

  return window.indexedDB
}

function createHandoffId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()

  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = getIndexedDb().open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(PHOTO_STORE)) {
        database.createObjectStore(PHOTO_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local photo storage'))
    request.onblocked = () => reject(new Error('Local photo storage is blocked'))
  })
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Local photo transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Local photo transaction was aborted'))
  })
}

async function pruneExpiredHandoffs(database: IDBDatabase, now: number): Promise<void> {
  const transaction = database.transaction(PHOTO_STORE, 'readwrite')
  const store = transaction.objectStore(PHOTO_STORE)

  store.openCursor().onsuccess = (event) => {
    const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
    if (!cursor) return

    const record = cursor.value as StoredPhotoHandoff
    if (record.expiresAt <= now) cursor.delete()
    cursor.continue()
  }

  await waitForTransaction(transaction)
}

/**
 * Stores a photo only in this browser, for a short one-time handoff into Face Analysis.
 * Nothing is uploaded until the user explicitly starts the analysis.
 */
export async function saveFaceAnalysisPhotoHandoff(file: File): Promise<string> {
  const database = await openDatabase()
  const now = Date.now()
  const id = createHandoffId()

  try {
    await pruneExpiredHandoffs(database, now)

    const transaction = database.transaction(PHOTO_STORE, 'readwrite')
    transaction.objectStore(PHOTO_STORE).put({
      id,
      blob: file.slice(0, file.size, file.type),
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
      expiresAt: now + HANDOFF_TTL_MS,
    } satisfies StoredPhotoHandoff)
    await waitForTransaction(transaction)
    return id
  } finally {
    database.close()
  }
}

/**
 * Reads and deletes a handoff in one transaction. A refresh after consumption cannot
 * silently reuse the user's photo.
 */
export async function consumeFaceAnalysisPhotoHandoff(id: string): Promise<File | null> {
  if (!id) return null

  const database = await openDatabase()

  try {
    const transaction = database.transaction(PHOTO_STORE, 'readwrite')
    const store = transaction.objectStore(PHOTO_STORE)
    const request = store.get(id)
    const record = await new Promise<StoredPhotoHandoff | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as StoredPhotoHandoff | undefined)
      request.onerror = () => reject(request.error ?? new Error('Could not read the local photo'))
    })

    store.delete(id)
    await waitForTransaction(transaction)

    if (!record || record.expiresAt <= Date.now()) return null

    return new File([record.blob], record.name, {
      type: record.type,
      lastModified: record.lastModified,
    })
  } finally {
    database.close()
  }
}
