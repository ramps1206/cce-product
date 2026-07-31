import { useEffect, useMemo, useState } from 'react'
import { getScalar } from '../lib/store'
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
  med?: string
  classId?: string
  aadhaar?: string
  udiseStud?: string
  address?: string
  mobile?: string
}

interface ClassRow {
  std?: string
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
  type?: string
  med?: string
}

const MR_DIGITS = ['शून्य', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ']
const MR_MONTHS = [
  'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
  'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर',
]

/** dd/mm/yyyy from an ISO (yyyy-mm-dd) date string. */
function formatDate(iso?: string): string {
  if (!iso) return '—'
  const p = iso.split('-')
  if (p.length !== 3) return iso
  return `${p[2]}/${p[1]}/${p[0]}`
}

/** Read out digits of a number in Marathi (used for the year, e.g. २००५ -> दोन शून्य शून्य पाच). */
function mrDigits(n: number): string {
  return String(n)
    .split('')
    .map((d) => MR_DIGITS[Number(d)] ?? d)
    .join(' ')
}

/** Birth date written out in Marathi words, e.g. "5 जुलै (दोन शून्य पाच)". */
function mrDateWords(iso?: string): string {
  if (!iso) return '—'
  const p = iso.split('-')
  if (p.length !== 3) return '—'
  const y = parseInt(p[0], 10)
  const m = parseInt(p[1], 10)
  const d = parseInt(p[2], 10)
  if (!y || !m || !d) return '—'
  const month = MR_MONTHS[m - 1] || ''
  return `${mrDigits(d)} ${month} ${mrDigits(y)}`.trim()
}

export default function TransferCertificate() {
  const { rows: classRows } = useCollection<ClassRow>('classes')
  const { rows: studentRows } = useCollection<Student>('students')
  const [school, setSchool] = useState<School>({})

  const [classId, setClassId] = useState('')
  const [studentKey, setStudentKey] = useState('')

  // Operator-filled TC fields (local only, not persisted).
  const [tcNo, setTcNo] = useState('')
  const [tcDate, setTcDate] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [admDate, setAdmDate] = useState('')
  const [admClass, setAdmClass] = useState('')
  const [lastClass, setLastClass] = useState('')
  const [progress, setProgress] = useState('चांगली')
  const [conduct, setConduct] = useState('चांगली')
  const [reason, setReason] = useState('')
  const [remark, setRemark] = useState('')

  useEffect(() => {
    getScalar('school').then((s) => setSchool((s as School) || {}))
  }, [])

  const classStudents = useMemo(
    () => studentRows.filter((r) => !classId || String(r.payload.classId) === String(classId)),
    [studentRows, classId]
  )

  const selectedClass = useMemo(
    () => classRows.find((r) => String(r.key) === String(classId))?.payload,
    [classRows, classId]
  )

  const student = useMemo(
    () => studentRows.find((r) => String(r.key) === String(studentKey))?.payload,
    [studentRows, studentKey]
  )

  // The student's own class (for "शेवटी शिकत असलेली इयत्ता").
  const studentClass = useMemo(() => {
    if (!student) return undefined
    return classRows.find((r) => String(r.key) === String(student.classId))?.payload
  }, [classRows, student])

  function selectClass(id: string) {
    setClassId(id)
    setStudentKey('')
  }

  const nationality = 'भारतीय'
  const schoolName = school.name || 'जिल्हा परिषद प्राथमिक शाळा'

  const fields: [string, string][] = student
    ? [
        ['जनरल रजिस्टर क्रमांक (GR No.)', student.regNo || '—'],
        ['UDISE PEN', student.udiseStud || '—'],
        ['विद्यार्थ्याचे संपूर्ण नाव', student.name || '—'],
        ['आईचे नाव', student.mName || '—'],
        ['वडिलांचे नाव', student.fName || '—'],
        ['राष्ट्रीयत्व', nationality],
        ['धर्म / जात', student.caste || '—'],
        ['जन्मतारीख (अंकी)', formatDate(student.dob)],
        ['जन्मतारीख (अक्षरी)', mrDateWords(student.dob)],
        ['जन्मस्थळ', birthPlace || '—'],
        ['शाळेत दाखल दिनांक', admDate ? formatDate(admDate) : '—'],
        ['दाखल केलेली इयत्ता', admClass || '—'],
        ['शेवटी शिकत असलेली इयत्ता', studentClass ? clsName(studentClass) : '—'],
        ['शेवटची उत्तीर्ण इयत्ता', lastClass || '—'],
        ['अभ्यासातील प्रगती', progress || '—'],
        ['वर्तणूक', conduct || '—'],
        ['शाळा सोडल्याची तारीख', tcDate ? formatDate(tcDate) : '—'],
        ['शाळा सोडल्याचे कारण', reason || '—'],
        ['शेरा', remark || '—'],
      ]
    : []

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-bdr bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm'
  const lblCls = 'block text-xs font-semibold text-slate-600 mb-1'

  return (
    <div>
      <PageHeader title="शाळा सोडल्याचा दाखला (TC)">
        <button onClick={() => window.print()} disabled={!student} className={btnGhost}>
          🖨 प्रिंट
        </button>
      </PageHeader>

      {/* Controls — hidden while printing */}
      <div className="print:hidden bg-card border border-bdr rounded-xl p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className={lblCls}>वर्ग</label>
            <select value={classId} onChange={(e) => selectClass(e.target.value)} className={inputCls}>
              <option value="">— वर्ग निवडा —</option>
              {classRows.map((r) => (
                <option key={r.key} value={r.key}>
                  {clsName(r.payload)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={lblCls}>विद्यार्थी</label>
            <select
              value={studentKey}
              onChange={(e) => setStudentKey(e.target.value)}
              disabled={!classId}
              className={inputCls}
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
            <label className={lblCls}>दाखला क्रमांक</label>
            <input value={tcNo} onChange={(e) => setTcNo(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={lblCls}>दाखला दिल्याची तारीख</label>
            <input type="date" value={tcDate} onChange={(e) => setTcDate(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={lblCls}>जन्मस्थळ</label>
            <input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={lblCls}>शाळेत दाखल दिनांक</label>
            <input type="date" value={admDate} onChange={(e) => setAdmDate(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={lblCls}>दाखल केलेली इयत्ता</label>
            <input value={admClass} onChange={(e) => setAdmClass(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={lblCls}>शेवटची उत्तीर्ण इयत्ता</label>
            <input value={lastClass} onChange={(e) => setLastClass(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={lblCls}>प्रगती</label>
            <input value={progress} onChange={(e) => setProgress(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={lblCls}>वर्तणूक</label>
            <input value={conduct} onChange={(e) => setConduct(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={lblCls}>शाळा सोडल्याचे कारण</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={lblCls}>शेरा</label>
            <input value={remark} onChange={(e) => setRemark(e.target.value)} className={inputCls} />
          </div>
        </div>
        {selectedClass && !student && (
          <p className="text-xs text-slate-500 mt-3">वर्ग {clsName(selectedClass)} — विद्यार्थी निवडा.</p>
        )}
      </div>

      {/* A4 printable दाखला */}
      {student ? (
        <div className="mx-auto bg-white text-slate-900 border-2 border-double border-sf rounded-md print:border print:rounded-none print:shadow-none shadow-sm w-full max-w-[794px] p-8 print:p-10">
          {/* Header */}
          <div className="text-center border-b-2 border-sf pb-3 mb-4">
            <div className="text-xl font-bold text-sf">{schoolName}</div>
            {school.address && <div className="text-sm text-slate-700 mt-0.5">{school.address}</div>}
            <div className="text-xs text-slate-600 mt-0.5">
              {[school.tal && `ता. ${school.tal}`, school.dist && `जि. ${school.dist}`]
                .filter(Boolean)
                .join('  |  ')}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              UDISE: {school.udise || '—'}
              {school.med ? `  |  माध्यम: ${school.med}` : ''}
              {school.yr ? `  |  शैक्षणिक वर्ष: ${school.yr}` : ''}
            </div>
            <div className="mt-3 inline-block text-lg font-bold text-gold border-y border-gold px-6 py-1">
              शाळा सोडल्याचा दाखला
            </div>
            <div className="text-xs text-slate-500 mt-1">(Transfer Certificate)</div>
          </div>

          {/* Meta row */}
          <div className="flex justify-between text-sm mb-3">
            <div>
              दाखला क्र.: <b>{tcNo || '—'}</b>
            </div>
            <div>
              दिनांक: <b>{tcDate ? formatDate(tcDate) : '—'}</b>
            </div>
          </div>

          {/* Numbered field list */}
          <table className="w-full text-sm border-collapse">
            <tbody>
              {fields.map(([label, value], i) => (
                <tr key={label} className="border-b border-bdr align-top">
                  <td className="py-1.5 pr-2 w-8 text-slate-500 text-right">{i + 1}.</td>
                  <td className="py-1.5 pr-3 w-[45%] font-medium text-slate-700">{label}</td>
                  <td className="py-1.5 text-slate-900">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Declaration */}
          <p className="text-xs text-slate-600 mt-4 leading-relaxed">
            वरील माहिती शाळेच्या सर्वसाधारण नोंदवहीवरून खरी व बरोबर असल्याचे प्रमाणित करण्यात येते.
          </p>

          {/* Footer signatures */}
          <div className="flex justify-between items-end mt-12 text-sm">
            <div className="text-center">
              <div className="border-t border-slate-400 pt-1 px-4">वर्गशिक्षक</div>
            </div>
            <div className="text-center">
              <div className="w-24 h-16 border border-dashed border-slate-400 rounded flex items-center justify-center text-[10px] text-slate-400 mx-auto">
                शाळेचा शिक्का
              </div>
              <div className="text-xs text-slate-500 mt-1">दिनांक: {tcDate ? formatDate(tcDate) : '—'}</div>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 pt-1 px-4">
                मुख्याध्यापक
                {school.prin && <div className="text-xs text-slate-500">{school.prin}</div>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="print:hidden text-center text-slate-400 py-16 border border-dashed border-bdr rounded-xl">
          दाखला पाहण्यासाठी वर्ग व विद्यार्थी निवडा.
        </div>
      )}
    </div>
  )
}
