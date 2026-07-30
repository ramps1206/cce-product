import { db, pk } from './db'

/** Upsert a local item and mark it dirty (pending push). */
export async function putItem(part: string, key: string, payload: any) {
  await db.items.put({
    pk: pk(part, key),
    part,
    key,
    payload,
    updatedAt: new Date().toISOString(),
    deleted: 0,
    dirty: 1,
  })
}

/** Tombstone a local item (soft delete) and mark it dirty. */
export async function removeItem(part: string, key: string) {
  const existing = await db.items.get(pk(part, key))
  await db.items.put({
    pk: pk(part, key),
    part,
    key,
    payload: existing?.payload ?? null,
    updatedAt: new Date().toISOString(),
    deleted: 1,
    dirty: 1,
  })
}

/** All live (non-deleted) items of an array part, as {key, payload}. */
export async function listPart(part: string): Promise<{ key: string; payload: any }[]> {
  const rows = await db.items.where('part').equals(part).toArray()
  return rows.filter((r) => !r.deleted).map((r) => ({ key: r.key, payload: r.payload }))
}

export async function countPart(part: string): Promise<number> {
  return (await listPart(part)).length
}

/** Next numeric client id for an array part (max existing + 1). */
export async function nextId(part: string): Promise<number> {
  const rows = await db.items.where('part').equals(part).toArray()
  const max = rows.reduce((m, r) => Math.max(m, Number(r.key) || 0), 0)
  return max + 1
}

export async function getScalar(part: string): Promise<any> {
  const r = await db.items.get(pk(part, '_'))
  return r && !r.deleted ? r.payload : null
}
export async function putScalar(part: string, payload: any) {
  await putItem(part, '_', payload)
}
