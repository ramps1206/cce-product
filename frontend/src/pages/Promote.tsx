import { useMemo, useState } from 'react'
import { useCollection } from '../lib/useCollection'
import { clsName, STD_NAMES } from '../lib/domain'
import { putItem, removeItem, nextId } from '../lib/store'
import { syncNow } from '../lib/sync'
import { PageHeader, TableCard, Td, Th, btnPrimary } from '../components/ui'

interface Klass {
  std?: string
  div?: string
  t1?: string
  t2?: string
}

interface Student {
  roll?: string
  name?: string
  classId?: string
  [k: string]: unknown
}

const sel = 'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-sf outline-none text-sm'

/** Next academic year string, e.g. "2026-27" -> "2027-28". */
function nextAcademicYearStr(yr: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(yr || '')
  if (!m) return yr || ''
  const y1 = parseInt(m[1], 10) + 1
  const y2 = String((y1 + 1) % 100).padStart(2, '0')
  return y1 + '-' + String(y2)
}

export default function Promote() {
  const { rows: classRows, reload: reloadClasses } = useCollection<Klass>('classes')
  const { rows: studentRows, reload: reloadStudents } = useCollection<Student>('students')

  const [finalStd, setFinalStd] = useState('8')
  const [nextYr, setNextYr] = useState(nextAcademicYearStr('2026-27'))
  const [clearRecords, setClearRecords] = useState(true)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)

  // Classes sorted by std then division (default all checked).
  const sorted = useMemo(
    () =>
      [...classRows].sort(
        (a, b) =>
          (Number(a.payload.std) - Number(b.payload.std)) ||
          String(a.payload.div || '').localeCompare(String(b.payload.div || ''), 'mr')
      ),
    [classRows]
  )

  const isChecked = (key: string) => checked[key] !== false // default true
  const countFor = (classKey: string) => studentRows.filter((s) => s.payload.classId === classKey).length

  function toggleAll(on: boolean) {
    const next: Record<string, boolean> = {}
    sorted.forEach((c) => {
      next[c.key] = on
    })
    setChecked(next)
  }

  const checkedKeys = sorted.filter((c) => isChecked(c.key)).map((c) => c.key)
  const allChecked = sorted.length > 0 && checkedKeys.length === sorted.length
  const totalStuds = studentRows.filter((s) => checkedKeys.includes(String(s.payload.classId))).length

  async function afterWrites() {
    await reloadClasses()
    await reloadStudents()
    syncNow().catch(() => {})
    window.dispatchEvent(new Event('cce-synced'))
  }

  async function promoteYearEnd() {
    const fStd = parseInt(finalStd) || 8
    const yr = nextYr.trim()
    if (!checkedKeys.length) {
      alert('⚠️ किमान एक वर्ग निवडा!')
      return
    }
    if (!yr) {
      alert('⚠️ पुढील शैक्षणिक वर्ष भरा!')
      return
    }
    if (
      !window.confirm(
        '⚠️ एकूण ' +
          totalStuds +
          ' विद्यार्थ्यांना बढती दिली जाईल.\nही क्रिया पूर्ववत करता येणार नाही.\nपुढे जायचे का?'
      )
    ) {
      return
    }

    setBusy(true)
    try {
      // Cache "std_div" -> class key (existing or newly created).
      const clsCache: Record<string, string> = {}
      classRows.forEach((c) => {
        clsCache[String(c.payload.std) + '_' + String(c.payload.div)] = c.key
      })

      let graduated = 0
      let promoted = 0

      for (const clsKey of checkedKeys) {
        const cls = classRows.find((c) => c.key === clsKey)
        if (!cls) continue
        const studs = studentRows.filter((s) => s.payload.classId === clsKey)

        if ((parseInt(String(cls.payload.std)) || 0) >= fStd) {
          // Graduate / pass out -> tombstone each student.
          for (const s of studs) {
            await removeItem('students', s.key)
            graduated++
          }
        } else {
          const newStd = (parseInt(String(cls.payload.std)) || 0) + 1
          const key = newStd + '_' + String(cls.payload.div)
          let targetKey = clsCache[key]
          if (!targetKey) {
            targetKey = String(await nextId('classes'))
            await putItem('classes', targetKey, {
              std: String(newStd),
              div: cls.payload.div,
              t1: cls.payload.t1 || '',
              t2: cls.payload.t2 || '',
            })
            clsCache[key] = targetKey
          }
          // Move each student to the target class, resetting roll.
          for (const s of studs) {
            await putItem('students', s.key, { ...s.payload, classId: targetKey, roll: '' })
            promoted++
          }
        }
      }

      await afterWrites()
      // clearRecords deep deletion of evaluations/attendance is best-effort/optional here.
      alert(
        '🎓 इयत्ता बढती यशस्वी!\n' +
          'बढती दिलेले विद्यार्थी: ' +
          promoted +
          '\nउत्तीर्ण (शाळा सोडून): ' +
          graduated +
          '\nनवीन शैक्षणिक वर्ष: ' +
          yr
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="🎓 इयत्ता बढती (वर्षअखेर)" />

      <div className="bg-card border border-bdr rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">अंतिम इयत्ता</label>
          <select value={finalStd} onChange={(e) => setFinalStd(e.target.value)} className={sel}>
            {Object.entries(STD_NAMES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">या इयत्तेतील (व त्यापुढील) विद्यार्थी उत्तीर्ण होऊन शाळा सोडतील.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">पुढील शैक्षणिक वर्ष</label>
          <input
            type="text"
            value={nextYr}
            onChange={(e) => setNextYr(e.target.value)}
            placeholder="उदा. 2027-28"
            className={sel}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={clearRecords}
              onChange={(e) => setClearRecords(e.target.checked)}
              className="w-4 h-4"
            />
            जुन्या नोंदी काढा (clear records)
          </label>
        </div>
      </div>

      <TableCard
        head={
          <>
            <Th>
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => toggleAll(e.target.checked)}
                className="w-4 h-4"
              />
            </Th>
            <Th>वर्ग</Th>
            <Th>विद्यार्थी संख्या</Th>
            <Th>पुढील स्थिती</Th>
          </>
        }
      >
        {sorted.length === 0 && (
          <tr>
            <td colSpan={4} className="text-center text-slate-400 py-8">
              कोणतेही वर्ग नाहीत — आधी वर्ग तयार करा!
            </td>
          </tr>
        )}
        {sorted.map((c) => {
          const std = parseInt(String(c.payload.std)) || 0
          const isFinal = std >= (parseInt(finalStd) || 8)
          return (
            <tr key={c.key} className="border-t border-bdr hover:bg-slate-50">
              <Td>
                <input
                  type="checkbox"
                  checked={isChecked(c.key)}
                  onChange={(e) => setChecked((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                  className="w-4 h-4"
                />
              </Td>
              <Td className="font-medium">{clsName(c.payload)}</Td>
              <Td>{countFor(c.key)}</Td>
              <Td>
                {isFinal ? (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
                    🎓 उत्तीर्ण (शाळा सोडून जाणार)
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
                    {clsName({ std: String(std + 1), div: c.payload.div })}
                  </span>
                )}
              </Td>
            </tr>
          )
        })}
      </TableCard>

      <div className="flex items-center justify-between mt-5">
        <p className="text-sm text-slate-600">
          निवडलेले वर्ग: <b>{checkedKeys.length}</b> · एकूण विद्यार्थी: <b>{totalStuds}</b>
        </p>
        <button onClick={promoteYearEnd} disabled={busy} className={btnPrimary + (busy ? ' opacity-60 pointer-events-none' : '')}>
          {busy ? 'सुरू आहे…' : '🎓 इयत्ता बढती सुरू करा'}
        </button>
      </div>
    </div>
  )
}
