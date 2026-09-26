import { parseTemplateRecord, type TemplateRecord } from './templateRecord'

/** 템플릿 저장소. 구현: IndexedDB(기본) / 메모리(IndexedDB를 쓸 수 없을 때) */
export interface TemplateStore {
  /** 새로고침 후에도 남는지 */
  readonly persistent: boolean
  /** 손상된 기록은 건너뛰고 개수를 알려준다 */
  list(): Promise<{ records: TemplateRecord[]; skipped: number }>
  put(record: TemplateRecord): Promise<void>
  remove(id: string): Promise<void>
}

export class TemplateStoreError extends Error {
  readonly quota: boolean
  constructor(message: string, quota = false) {
    super(message)
    this.quota = quota
  }
}

function parseAll(values: unknown[]): { records: TemplateRecord[]; skipped: number } {
  const records: TemplateRecord[] = []
  let skipped = 0
  for (const value of values) {
    const record = parseTemplateRecord(value)
    if (record) records.push(record)
    else skipped++
  }
  return { records, skipped }
}

export function createMemoryTemplateStore(): TemplateStore {
  const data = new Map<string, unknown>()
  return {
    persistent: false,
    async list() {
      return parseAll([...data.values()])
    },
    async put(record) {
      data.set(record.id, structuredClone(record))
    },
    async remove(id) {
      data.delete(id)
    },
  }
}

const DB_NAME = 'dear2004'
const DB_VERSION = 1
const STORE = 'templates'

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function toStoreError(error: unknown): TemplateStoreError {
  const quota = error instanceof DOMException && error.name === 'QuotaExceededError'
  return new TemplateStoreError(error instanceof Error ? error.message : 'storage error', quota)
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('blocked'))
  })
}

async function transact<T>(db: IDBDatabase, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const tx = db.transaction(STORE, mode)
  const result = requestToPromise(run(tx.objectStore(STORE)))
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
  return result
}

async function createIndexedDbTemplateStore(): Promise<TemplateStore> {
  const db = await openDatabase()
  return {
    persistent: true,
    async list() {
      try {
        return parseAll(await transact(db, 'readonly', (s) => s.getAll()))
      } catch (e) {
        throw toStoreError(e)
      }
    },
    async put(record) {
      try {
        await transact(db, 'readwrite', (s) => s.put(record))
      } catch (e) {
        throw toStoreError(e)
      }
    },
    async remove(id) {
      try {
        await transact(db, 'readwrite', (s) => s.delete(id))
      } catch (e) {
        throw toStoreError(e)
      }
    },
  }
}

/** IndexedDB를 열 수 없으면(일부 사생활 보호 모드 등) 메모리 저장소로 대신한다 */
export async function openTemplateStore(): Promise<TemplateStore> {
  if (typeof indexedDB === 'undefined') return createMemoryTemplateStore()
  try {
    return await createIndexedDbTemplateStore()
  } catch {
    return createMemoryTemplateStore()
  }
}
