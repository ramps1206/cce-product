import Dexie, { type Table } from 'dexie'

/**
 * Local offline store. Mirrors the backend sync model exactly: every unit of
 * data is an Item identified by (part, key). `dirty` marks a local change not
 * yet pushed to the server; `deleted` is a tombstone.
 */
export interface Item {
  pk: string // `${part}::${key}`
  part: string
  key: string
  payload: any
  updatedAt: string // ISO-8601
  deleted: number // 0 | 1
  dirty: number // 0 | 1
}

export interface Meta {
  k: string
  v: any
}

class CceDB extends Dexie {
  items!: Table<Item, string>
  meta!: Table<Meta, string>

  constructor() {
    super('cce')
    this.version(1).stores({
      items: 'pk, part, dirty',
      meta: 'k',
    })
  }
}

export const db = new CceDB()

export const pk = (part: string, key: string) => `${part}::${key}`

/** Parse an ISO timestamp to millis for last-write-wins comparison. */
export const ms = (iso: string | null | undefined) => (iso ? Date.parse(iso) : 0)
