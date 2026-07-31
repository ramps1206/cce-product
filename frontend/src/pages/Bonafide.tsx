import { useEffect, useMemo, useState } from 'react'
import { getScalar, listPart } from '../lib/store'
import { useCollection } from '../lib/useCollection'
import { clsName } from '../lib/domain'
import { PageHeader, btnGhost } from '../components/ui'

interface Student {
  regNo?: string
  roll?: string
  name?: string
  mName?: string
  fName?: string
  dob?: string
  gender?: string
  caste?: string
  classId?: string
  aadhaar?: string
  udiseStud?: string
  address?: string
}

interface ClassRow {
  std?: string | number
  div?: string
}

interface School {
  name?: string
  udise?: string
  address?: string
  dist?: string
  tal?: string
  prin?: string
  yr?: string
}

interface Pronouns {
  haHi: string
  tyachiTichi: string
  hotaHoti: string
}

function bfcPronouns(gender?: string): Pronouns {
  const isBoy = (gender || 'मुलगा') === 'मुलगा'
  return {
    haHi: isBoy ? 'हा' : 'ही',
    tyachiTichi: isBoy ? 'त्याची' : 'तिची',
    hotaHoti: isBoy ? 'होता' : 'होती',
  }
}

/** DD-MM-YYYY from an ISO (YYYY-MM-DD) date string. */
function formatDate(iso?: string): string {
  if (!iso) return '--'
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const [y, m, d] = parts
  return `${d}-${m}-${y}`
}

export default function Bonafide() {
  const { rows: classRows } = useCollection<ClassRow>('classes')
  const [students, setStudents] = useState<{ key: string; payload: Student }[]>([])
  const [school, setSchool] = useState<School>({})

  const [cls, setCls] = useState('')
  const [studentKey, setStudentKey] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [place, setPlace] = useState('')

  async function load() {
    setStudents((await listPart('students')) as { key: string; payload: Student }[])
    setSchool(((await getScalar('school')) as School) || {})
  }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  // Default the print place to the school's taluka once school data lands.
  useEffect(() => {
    if (!place && school.tal) setPlace(school.tal)
  }, [school.tal, place])

  const classes = classRows.map((c) => c.key)
  const classMap = useMemo(
    () => Object.fromEntries(classRows.map((c) => [c.key, c.payload])) as Record<string, ClassRow>,
    [classRows]
  )

  const classStudents = students
    .filter((s) => !cls || s.payload.classId === cls)
    .sort((a, b) => (Number(a.payload.roll) || 0) - (Number(b.payload.roll) || 0))

  // Reset student selection when the class changes and the pick no longer fits.
  useEffect(() => {
    if (studentKey && !classStudents.some((s) => s.key === studentKey)) setStudentKey('')
  }, [cls, studentKey, classStudents])

  const student = students.find((s) => s.key === studentKey)
  const s = student?.payload
  const stCls = s?.classId ? classMap[s.classId] : undefined
  const p = bfcPronouns(s?.gender)
  const yr = school.yr || '2026-27'

  return (
    <div>
      <PageHeader title="बोनाफाईड सर्टिफिकेट">
        <button className={btnGhost} onClick={() => window.print()} disabled={!s}>
          🖨 प्रिंट
        </button>
      </PageHeader>

      {/* Controls — hidden on print */}
      <div className="print:hidden bg-card border border-bdr rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">वर्ग</label>
          <select
            value={cls}
            onChange={(e) => setCls(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm min-w-[160px]"
          >
            <option value="">— वर्ग निवडा —</option>
            {classes.map((k) => (
              <option key={k} value={k}>
                {clsName(classMap[k])}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">विद्यार्थी</label>
          <select
            value={studentKey}
            onChange={(e) => setStudentKey(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm min-w-[200px]"
          >
            <option value="">— विद्यार्थी निवडा —</option>
            {classStudents.map((r) => (
              <option key={r.key} value={r.key}>
                {r.payload.roll ? `${r.payload.roll}. ` : ''}
                {r.payload.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">दिनांक</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">ठिकाण</label>
          <input
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="ठिकाण"
            className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
          />
        </div>
      </div>

      {!s && (
        <div className="print:hidden text-sm text-slate-500 bg-card border border-bdr rounded-xl p-6 text-center">
          प्रमाणपत्र पाहण्यासाठी वर्ग व विद्यार्थी निवडा.
        </div>
      )}

      {/* A4 printable certificate */}
      {s && (
        <div className="bfc-wrap">
          <div className="bfc-card">
            {/* School header */}
            <div className="bfc-head">
              <div className="bfc-sch-name">{school.name || '—'}</div>
              {school.address && <div className="bfc-sch-sub">{school.address}</div>}
              <div className="bfc-sch-sub">
                {[school.tal, school.dist].filter(Boolean).join(' | ')}
              </div>
              <div className="bfc-sch-udise">
                UDISE: {school.udise || '—'} | शैक्षणिक वर्ष: {yr}
              </div>
            </div>

            <div className="bfc-title">बोनाफाईड प्रमाणपत्र</div>

            <div className="bfc-body">
              प्रमाणित करण्यात येते की, श्री./कु. <b>{s.name || '......'}</b> जनरल रजि. नंबर{' '}
              <b>{s.regNo || '......'}</b> {p.haHi} आमच्या शाळेत इयत्ता{' '}
              <b>{stCls ? clsName(stCls) : '......'}</b> मध्ये शैक्षणिक वर्ष <b>{yr}</b> मध्ये शिकत{' '}
              <b>आहे</b>. {p.tyachiTichi} जन्मतारीख <b>{formatDate(s.dob)}</b> असून जन्मनोंदीनुसार
              बरोबर आहे. {p.tyachiTichi} जात <b>{s.caste || '......'}</b> असून वडिलांचे नाव{' '}
              <b>{s.fName || '......'}</b> व आईचे नाव <b>{s.mName || '......'}</b> असे आहे. सदर
              विद्यार्थ्याचे वर्तन समाधानकारक आहे.
              <div className="bfc-note">
                वरील माहिती शाळेच्या जनरल रजिस्टर नं. १ प्रमाणे दिली असून ती अचूक आहे.
              </div>
            </div>

            <div className="bfc-footer">
              <div>
                <div>दिनांक- {formatDate(date)}</div>
                <div style={{ marginTop: 4 }}>ठिकाण- {place || school.tal || '--'}</div>
              </div>
              <div className="bfc-sign">
                मुख्याध्यापक
                <br />
                <small>{school.prin || ''}</small>
                <div className="bfc-stamp">(शाळेचा शिक्का)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bfc-wrap { max-width: 760px; margin: 4px auto; }
        .bfc-card {
          border: 3px double #0D2B3E; border-radius: 6px;
          padding: 34px 40px; background: #fff;
          page-break-inside: avoid; break-inside: avoid;
        }
        .bfc-head {
          text-align: center; border-bottom: 2px solid #1B5E84;
          padding-bottom: 12px; margin-bottom: 10px;
        }
        .bfc-sch-name { font-size: 22px; font-weight: 800; color: #0D2B3E; }
        .bfc-sch-sub { font-size: 12.5px; color: #444; margin-top: 3px; }
        .bfc-sch-udise { font-size: 12px; font-weight: 600; color: #1B5E84; margin-top: 4px; }
        .bfc-title {
          text-align: center; font-size: 24px; font-weight: 800; color: #0D2B3E;
          letter-spacing: 1px; margin: 20px 0 26px;
          text-decoration: underline; text-underline-offset: 6px;
        }
        .bfc-body { font-size: 15px; line-height: 2.2; color: #111; text-align: justify; }
        .bfc-body b { border-bottom: 1px dotted #555; padding: 0 2px; font-weight: 700; }
        .bfc-note { margin-top: 24px; font-size: 13.5px; }
        .bfc-footer {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-top: 64px; font-size: 13.5px;
        }
        .bfc-sign { text-align: center; font-weight: 700; }
        .bfc-sign small { display: block; font-weight: 400; font-size: 11.5px; color: #666; margin-top: 2px; }
        .bfc-stamp { font-weight: 400; font-size: 11px; color: #999; margin-top: 30px; }
        @media print {
          @page { size: A4 portrait; margin: 16mm; }
          .bfc-wrap { max-width: none; margin: 0; }
          .bfc-card { border-width: 3px; }
        }
      `}</style>
    </div>
  )
}
