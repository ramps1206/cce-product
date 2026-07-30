export interface Band {
  grade: string // श्रेणी
  min: number // minimum percentage (inclusive)
}

/** Maharashtra CCE-style default grade bands (श्रेणी). Editable in Grades page. */
export const DEFAULT_BANDS: Band[] = [
  { grade: 'अ', min: 75 },
  { grade: 'ब', min: 50 },
  { grade: 'क', min: 35 },
  { grade: 'ड', min: 0 },
]

export function gradeFor(pct: number, bands: Band[] = DEFAULT_BANDS): string {
  const sorted = [...bands].sort((a, b) => b.min - a.min)
  for (const b of sorted) if (pct >= b.min) return b.grade
  return sorted[sorted.length - 1]?.grade || '-'
}
