export interface Band {
  grade: string // श्रेणी
  min: number // minimum percentage (inclusive)
}

/** Maharashtra CCE-style default grade bands (श्रेणी). 9-grade श्रेणी सारणी. Editable in Grades page. */
export const DEFAULT_BANDS: Band[] = [
  { grade: 'A+', min: 91 },
  { grade: 'A', min: 76 },
  { grade: 'B+', min: 61 },
  { grade: 'B', min: 51 },
  { grade: 'C+', min: 41 },
  { grade: 'C', min: 31 },
  { grade: 'D', min: 21 },
  { grade: 'E1', min: 11 },
  { grade: 'E2', min: 0 },
]

/** अर्थ (meaning) for each श्रेणी. */
export const MEANINGS: Record<string, string> = {
  'A+': 'अत्युत्तम',
  A: 'उत्तम',
  'B+': 'खूप चांगले',
  B: 'चांगले',
  'C+': 'बरे',
  C: 'समाधानकारक',
  D: 'सुधारणा आवश्यक',
  E1: 'विशेष सुधारणा',
  E2: 'प्रयत्न आवश्यक',
}

export function gradeFor(pct: number, bands: Band[] = DEFAULT_BANDS): string {
  const sorted = [...bands].sort((a, b) => b.min - a.min)
  for (const b of sorted) if (pct >= b.min) return b.grade
  return sorted[sorted.length - 1]?.grade || '-'
}
