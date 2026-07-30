import { db, ms, pk } from './db'
import { api, type SyncItem } from './api'

const LAST_SYNC = 'cce_last_sync'

/**
 * One sync cycle: push all dirty local items, then pull remote changes since
 * the last cursor and merge with last-write-wins. Safe to call repeatedly.
 */
export async function syncNow(): Promise<{ pushed: number; pulled: number }> {
  if (!navigator.onLine) throw new Error('offline')

  // 1) Push dirty local changes.
  const dirty = await db.items.where('dirty').equals(1).toArray()
  if (dirty.length) {
    const items: SyncItem[] = dirty.map((d) => ({
      part: d.part,
      key: d.key,
      payload: d.payload,
      updatedAt: d.updatedAt,
      deleted: !!d.deleted,
    }))
    await api.push(items)
    // Clear the dirty flag for rows we just pushed (only if unchanged since).
    await db.transaction('rw', db.items, async () => {
      for (const d of dirty) {
        const cur = await db.items.get(d.pk)
        if (cur && cur.updatedAt === d.updatedAt) {
          cur.dirty = 0
          await db.items.put(cur)
        }
      }
    })
  }

  // 2) Pull remote changes since last cursor and merge (last-write-wins).
  const since = localStorage.getItem(LAST_SYNC) || undefined
  const pull = await api.pull(since)
  await db.transaction('rw', db.items, async () => {
    for (const it of pull.items) {
      const key = pk(it.part, it.key)
      const cur = await db.items.get(key)
      const apply =
        !cur ||
        (cur.dirty ? ms(it.updatedAt) > ms(cur.updatedAt) : ms(it.updatedAt) >= ms(cur.updatedAt))
      if (apply) {
        await db.items.put({
          pk: key,
          part: it.part,
          key: it.key,
          payload: it.payload,
          updatedAt: it.updatedAt,
          deleted: it.deleted ? 1 : 0,
          dirty: 0,
        })
      }
    }
  })
  localStorage.setItem(LAST_SYNC, pull.serverTime)
  return { pushed: dirty.length, pulled: pull.items.length }
}

/** Reset local sync state (used on logout). */
export async function resetLocal() {
  localStorage.removeItem(LAST_SYNC)
  await db.items.clear()
}
