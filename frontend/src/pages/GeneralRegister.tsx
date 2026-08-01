import { useEffect, useMemo, useState } from 'react'
import { listPart, putItem, removeItem, nextId } from '../lib/store'
import { useCollection } from '../lib/useCollection'
import { syncNow } from '../lib/sync'
import { clsName } from '../lib/domain'
import { PageHeader, btnPrimary, btnGhost } from '../components/ui'

/**
 * सर्वसाधारण नोंदवही (General Register) — the permanent, multi-column school
 * register. Each row is stored in the `generalRegister` array part. Rows created
 * from a student carry a `studentKey` link so the "sync" action never duplicates.
 */
interface GRRow {
  regNo?: string // रजि. नं.
  name?: string // विद्यार्थ्याचे पूर्ण नाव
  fName?: string // वडिलांचे नाव
  mName?: string // आईचे नाव
  caste?: string // जात
  subCaste?: string // पोटजात
  birthPlace?: string // जन्मस्थान
  dob?: string // जन्मतारीख
  gender?: string // लिंग
  med?: string // माध्यम
  prevSchool?: string // कोणत्या शाळेतून आला
  admissionDate?: string // शाळेत दाखल तारीख
  status?: string // सद्यस्थिती (चालू / सोडले)
  leftDate?: string // शाळा सोडल्याची तारीख
  studentKey?: string // link back to a students row (dedupe key for sync)
}

interface Student {
  regNo?: string
  roll?: string
  name?: string
  fName?: string
  mName?: string
  dob?: string
  gender?: string
  caste?: string
  med?: string
  classId?: string
  admissionDate?: string
  mobile?: string
  address?: string
}

interface Cls {
  std?: string
  div?: string
}

const PART = 'generalRegister'
const STATUS_OPTIONS = ['चालू', 'सोडले']

const inputCls =
  'w-full min-w-[7rem] px-2 py-1.5 rounded-md border border-bdr bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm'

/** Build a GR row payload from a student. */
function rowFromStudent(s: Student): GRRow {
  return {
    regNo: s.regNo || '',
    name: s.name || '',
    fName: s.fName || '',
    mName: s.mName || '',
    caste: s.caste || '',
    subCaste: '',
    birthPlace: '',
    dob: s.dob || '',
    gender: s.gender || '',
    med: s.med || '',
    prevSchool: '',
    admissionDate: s.admissionDate || '',
    status: 'चालू',
    leftDate: '',
  }
}

export default function GeneralRegister() {
  const { rows } = useCollection<GRRow>(PART)
  const { rows: classRows } = useCollection<Cls>('classes')
  const { rows: studentRows } = useCollection<Student>('students')

  const [pickClassId, setPickClassId] = useState('')
  const [pickStudentKey, setPickStudentKey] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [search, setSearch] = useState('')

  // Reset the chosen student when the class picker changes.
  useEffect(() => {
    setPickStudentKey('')
  }, [pickClassId])

  const classById = useMemo(() => {
    const m = new Map<string, Cls>()
    for (const c of classRows) m.set(c.key, c.payload)
    return m
  }, [classRows])

  const studentsOfPickedClass = useMemo(
    () => studentRows.filter((s) => !pickClassId || s.payload.classId === pickClassId),
    [studentRows, pickClassId]
  )

  // Class names present in the GR rows are derived from the linked student's
  // class where available; for the class filter we key off student links.
  const classNameForRow = useMemo(() => {
    const m = new Map<string, string>() // grRow.key -> class name
    for (const r of rows) {
      const sKey = r.payload.studentKey
      if (sKey) {
        const s = studentRows.find((x) => x.key === sKey)
        if (s && s.payload.classId) {
          const c = classById.get(s.payload.classId)
          if (c) m.set(r.key, clsName(c))
        }
      }
    }
    return m
  }, [rows, studentRows, classById])

  async function refreshAndBroadcast() {
    syncNow().catch(() => {})
    window.dispatchEvent(new Event('cce-synced'))
  }

  /** Add one GR row from the currently picked student. */
  async function addFromStudent() {
    if (!pickStudentKey) return
    const s = studentRows.find((x) => x.key === pickStudentKey)
    if (!s) return
    // Skip if this student is already in the register.
    if (rows.some((r) => r.payload.studentKey === pickStudentKey)) {
      setPickStudentKey('')
      return
    }
    const payload = rowFromStudent(s.payload)
    payload.studentKey = pickStudentKey
    if (!payload.regNo) payload.regNo = String(await nextId(PART))
    const key = String(await nextId(PART))
    await putItem(PART, key, payload)
    setPickStudentKey('')
    await refreshAndBroadcast()
  }

  /** Create a GR row for every student not already present. */
  async function syncFromStudents() {
    const existing = await listPart(PART)
    const linked = new Set(
      existing.map((r) => (r.payload as GRRow).studentKey).filter(Boolean) as string[]
    )
    let seq = await nextId(PART)
    let created = 0
    for (const s of studentRows) {
      if (linked.has(s.key)) continue
      const payload = rowFromStudent(s.payload)
      payload.studentKey = s.key
      if (!payload.regNo) payload.regNo = String(seq)
      const key = String(seq)
      await putItem(PART, key, payload)
      linked.add(s.key)
      seq += 1
      created += 1
    }
    if (created > 0) await refreshAndBroadcast()
  }

  /** Inline-edit one field of a GR row and persist immediately. */
  async function editField(key: string, payload: GRRow, field: keyof GRRow, value: string) {
    await putItem(PART, key, { ...payload, [field]: value })
    await refreshAndBroadcast()
  }

  async function del(key: string) {
    await removeItem(PART, key)
    await refreshAndBroadcast()
  }

  function exportCsv() {
    const headers = [
      'रजि. नं.', 'विद्यार्थ्याचे पूर्ण नाव', 'वडिलांचे नाव', 'आईचे नाव', 'जात', 'पोटजात',
      'जन्मस्थान', 'जन्मतारीख', 'लिंग', 'माध्यम', 'कोणत्या शाळेतून आला', 'शाळेत दाखल तारीख',
      'सद्यस्थिती', 'शाळा सोडल्याची तारीख',
    ]
    const esc = (v: unknown) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    const lines = [headers.join(',')]
    for (const r of filtered) {
      const p = r.payload
      lines.push(
        [
          p.regNo, p.name, p.fName, p.mName, p.caste, p.subCaste, p.birthPlace, p.dob,
          p.gender, p.med, p.prevSchool, p.admissionDate, p.status, p.leftDate,
        ]
          .map(esc)
          .join(',')
      )
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'general-register.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows
      .filter((r) => {
        if (filterClass && classNameForRow.get(r.key) !== filterClass) return false
        if (q) {
          const p = r.payload
          const hay = `${p.name ?? ''} ${p.regNo ?? ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => (Number(a.payload.regNo) || 0) - (Number(b.payload.regNo) || 0))
  }, [rows, filterClass, search, classNameForRow])

  const classNameOptions = useMemo(() => {
    const set = new Set<string>()
    for (const c of classRows) set.add(clsName(c.payload))
    return Array.from(set).sort()
  }, [classRows])

  const cols = [
    'रजि. नं.', 'विद्यार्थ्याचे पूर्ण नाव', 'वडिलांचे नाव', 'आईचे नाव', 'जात', 'पोटजात',
    'जन्मस्थान', 'जन्मतारीख', 'लिंग', 'माध्यम', 'कोणत्या शाळेतून आला', 'शाळेत दाखल तारीख',
    'सद्यस्थिती', 'शाळा सोडल्याची तारीख', 'काढा',
  ]

  return (
    <div>
      <PageHeader title="📖 सर्वसाधारण नोंदवही (General Register)">
        <button onClick={syncFromStudents} className={`${btnGhost} print:hidden`}>
          🔄 विद्यार्थ्यांमधून सिंक करा
        </button>
        <button onClick={exportCsv} className={`${btnGhost} print:hidden`}>
          ⬇ Excel/CSV
        </button>
        <button onClick={() => window.print()} className={`${btnPrimary} print:hidden`}>
          🖨 प्रिंट
        </button>
      </PageHeader>

      <div className="mb-4 rounded-xl border border-bdr bg-gold/10 px-4 py-3 text-sm text-slate-700 print:hidden">
        ही शाळेची कायमस्वरूपी नोंदवही आहे. प्रत्येक विद्यार्थ्याची संपूर्ण माहिती येथे नोंदवली जाते व ती
        कधीही मिटवली जात नाही. विद्यार्थी शाळा सोडल्यास फक्त सद्यस्थिती "सोडले" करा.
      </div>

      {/* Add a record by selecting a student */}
      <div className="mb-4 rounded-xl border border-bdr bg-card p-4 print:hidden">
        <div className="mb-2 text-sm font-semibold text-sf">+ विद्यार्थी निवडून नोंद जोडा</div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">वर्ग</label>
            <select
              value={pickClassId}
              onChange={(e) => setPickClassId(e.target.value)}
              className={inputCls}
            >
              <option value="">वर्ग निवडा</option>
              {classRows.map((c) => (
                <option key={c.key} value={c.key}>
                  {clsName(c.payload)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">विद्यार्थी</label>
            <select
              value={pickStudentKey}
              onChange={(e) => setPickStudentKey(e.target.value)}
              className={inputCls}
            >
              <option value="">विद्यार्थी निवडा</option>
              {studentsOfPickedClass.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.payload.name}
                  {s.payload.regNo ? ` (${s.payload.regNo})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button onClick={addFromStudent} disabled={!pickStudentKey} className={btnPrimary}>
            जोडा
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">वर्ग निवडा (फिल्टर)</label>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className={inputCls}
          >
            <option value="">सर्व वर्ग</option>
            {classNameOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">नाव / रजि. क्र. शोधा</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="शोधा…"
            className={inputCls}
          />
        </div>
        <div className="pb-1.5 text-sm font-semibold text-slate-600">एकूण नोंदी: {filtered.length}</div>
      </div>

      {/* Register table */}
      <div className="rounded-xl border border-bdr bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-sf/5 text-sf">
            <tr>
              {cols.map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2.5 text-left font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="py-8 text-center text-slate-400">
                  अद्याप नोंदी नाहीत
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const p = r.payload
              return (
                <tr key={r.key} className="border-t border-bdr hover:bg-slate-50 align-top">
                  <td className="px-3 py-2">
                    <input
                      value={p.regNo || ''}
                      onChange={(e) => editField(r.key, p, 'regNo', e.target.value)}
                      className={`${inputCls} min-w-[4.5rem]`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={p.name || ''}
                      onChange={(e) => editField(r.key, p, 'name', e.target.value)}
                      className={`${inputCls} min-w-[10rem]`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={p.fName || ''}
                      onChange={(e) => editField(r.key, p, 'fName', e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={p.mName || ''}
                      onChange={(e) => editField(r.key, p, 'mName', e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={p.caste || ''}
                      onChange={(e) => editField(r.key, p, 'caste', e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={p.subCaste || ''}
                      onChange={(e) => editField(r.key, p, 'subCaste', e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={p.birthPlace || ''}
                      onChange={(e) => editField(r.key, p, 'birthPlace', e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={p.dob || ''}
                      onChange={(e) => editField(r.key, p, 'dob', e.target.value)}
                      className={`${inputCls} min-w-[9rem]`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={p.gender || ''}
                      onChange={(e) => editField(r.key, p, 'gender', e.target.value)}
                      className={inputCls}
                    >
                      <option value="">—</option>
                      <option value="मुलगा">मुलगा</option>
                      <option value="मुलगी">मुलगी</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={p.med || ''}
                      onChange={(e) => editField(r.key, p, 'med', e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={p.prevSchool || ''}
                      onChange={(e) => editField(r.key, p, 'prevSchool', e.target.value)}
                      className={`${inputCls} min-w-[10rem]`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={p.admissionDate || ''}
                      onChange={(e) => editField(r.key, p, 'admissionDate', e.target.value)}
                      className={`${inputCls} min-w-[9rem]`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={p.status || 'चालू'}
                      onChange={(e) => editField(r.key, p, 'status', e.target.value)}
                      className={inputCls}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={p.leftDate || ''}
                      onChange={(e) => editField(r.key, p, 'leftDate', e.target.value)}
                      className={`${inputCls} min-w-[9rem]`}
                    />
                  </td>
                  <td className="px-3 py-2 print:hidden">
                    <button
                      onClick={() => del(r.key)}
                      className="whitespace-nowrap text-red-600 hover:underline"
                    >
                      काढा
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
