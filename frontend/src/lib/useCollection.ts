import { useCallback, useEffect, useState } from 'react'
import { listPart, nextId, putItem, removeItem } from './store'
import { syncNow } from './sync'

export interface Row<T = any> {
  key: string
  payload: T
}

/**
 * Reusable offline-first CRUD for an array part (students/classes/teachers/…).
 * Reads from IndexedDB, writes locally + marks dirty, and kicks a best-effort
 * background sync. Re-reads whenever a sync completes.
 */
export function useCollection<T = any>(part: string) {
  const [rows, setRows] = useState<Row<T>[]>([])

  const reload = useCallback(async () => {
    setRows((await listPart(part)) as Row<T>[])
  }, [part])

  useEffect(() => {
    reload()
    const h = () => reload()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [reload])

  const save = useCallback(
    async (key: string | null, payload: T) => {
      const k = key ?? String(await nextId(part))
      await putItem(part, k, payload)
      await reload()
      syncNow().catch(() => {})
    },
    [part, reload]
  )

  const remove = useCallback(
    async (key: string) => {
      await removeItem(part, key)
      await reload()
      syncNow().catch(() => {})
    },
    [part, reload]
  )

  return { rows, reload, save, remove }
}
