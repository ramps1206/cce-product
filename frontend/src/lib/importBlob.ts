import { putItem, putScalar } from './store'
import { syncNow } from './sync'

/**
 * Import a legacy CCE data blob (the old single-file app's
 * localStorage['cce_v76_data'] value) into the current school. Maps the blob
 * to the same part model the backend sync uses, marks everything dirty, then
 * syncs it up to Postgres.
 */
const ARRAY_PARTS = ['students', 'classes', 'teachers', 'generalRegister', 'scholarships']
const MAP_PARTS = ['evaluations', 'attendance', 'descriptiveNotes', 'bharansh', 'nipun']
const SCALAR_PARTS = ['school', 'workingDays', 'settings']

export interface ImportResult {
  total: number
  perPart: Record<string, number>
}

export async function importLegacyBlob(raw: string): Promise<ImportResult> {
  let blob: any
  try {
    blob = JSON.parse(raw)
  } catch {
    throw new Error('अवैध JSON — कृपया संपूर्ण cce_v76_data मजकूर पेस्ट करा')
  }
  if (!blob || typeof blob !== 'object') throw new Error('अवैध डेटा')

  const perPart: Record<string, number> = {}
  let total = 0

  for (const part of ARRAY_PARTS) {
    const arr = Array.isArray(blob[part]) ? blob[part] : []
    for (let i = 0; i < arr.length; i++) {
      const el = arr[i]
      const key = String(el?.id ?? el?.key ?? i + 1)
      await putItem(part, key, el)
      total++
      perPart[part] = (perPart[part] || 0) + 1
    }
  }

  for (const part of MAP_PARTS) {
    const obj = blob[part] && typeof blob[part] === 'object' ? blob[part] : {}
    for (const k of Object.keys(obj)) {
      await putItem(part, k, obj[k])
      total++
      perPart[part] = (perPart[part] || 0) + 1
    }
  }

  for (const part of SCALAR_PARTS) {
    if (blob[part] !== undefined) {
      await putScalar(part, blob[part])
      total++
      perPart[part] = (perPart[part] || 0) + 1
    }
  }

  await syncNow()
  return { total, perPart }
}
