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
  mobile?: string
  address?: string
  photo?: string
}

interface School {
  name?: string
  udise?: string
  address?: string
  dist?: string
  tal?: string
  phone?: string
  prin?: string
  yr?: string
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-1 border-b border-dotted border-slate-300 py-[1px] leading-snug">
      <span className="font-bold text-[#1B3A55] shrink-0">{label}</span>
      <span className="truncate text-slate-700">{value || '--'}</span>
    </div>
  )
}

function Card({
  student,
  classLabel,
  school,
}: {
  student: Student
  classLabel: string
  school: School
}) {
  const subParts = [
    school.tal ? 'ता. ' + school.tal : '',
    school.dist ? 'जि. ' + school.dist : '',
  ].filter(Boolean)
  return (
    <div className="break-inside-avoid overflow-hidden rounded-lg border-[1.5px] border-[#1B5E84] bg-white shadow-sm print:shadow-none flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D2B3E] to-[#1B5E84] px-2 py-1.5 text-center text-white [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
        <div className="truncate text-[13px] font-extrabold tracking-wide">
          {school.name || 'शाळेचे नाव'}
        </div>
        {subParts.length > 0 && (
          <div className="truncate text-[9px] font-medium opacity-90">
            {subParts.join(' | ')}
          </div>
        )}
        <div className="text-[9px] font-semibold opacity-90">
          UDISE: {school.udise || '--'}
        </div>
        <div className="mt-0.5 border-t border-white/25 pt-0.5 text-[9px] font-bold tracking-wide">
          विद्यार्थी ओळखपत्र · STUDENT ID CARD
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-2 p-2">
        <div className="flex h-[30mm] w-[24mm] shrink-0 items-center justify-center overflow-hidden rounded border border-[#B3D4E8] bg-[#F8FCFF]">
          {student.photo ? (
            <img src={student.photo} alt={student.name || ''} className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl text-slate-300">👤</span>
          )}
        </div>
        <div className="min-w-0 flex-1 text-[10.5px]">
          <InfoRow label="नाव:" value={student.name} />
          <InfoRow label="इयत्ता:" value={classLabel} />
          <InfoRow label="हजेरी क्र.:" value={student.roll} />
          <InfoRow label="जन्मदिनांक:" value={student.dob} />
          <InfoRow label="आई:" value={student.mName} />
          <InfoRow label="मोबाईल:" value={student.mobile} />
          <InfoRow label="आधार:" value={student.aadhaar} />
          <InfoRow label="PEN:" value={student.udiseStud} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-dashed border-slate-300 px-2 py-1 text-[8px] text-slate-500">
        <span>UDISE: {school.udise || '--'}</span>
        <span>शै. वर्ष: {school.yr || '--'}</span>
      </div>
    </div>
  )
}

export default function IdCard() {
  const { rows: classRows } = useCollection<any>('classes')
  const [students, setStudents] = useState<{ key: string; payload: Student }[]>([])
  const [school, setSchool] = useState<School>({})
  const [cls, setCls] = useState('')

  useEffect(() => {
    async function load() {
      setStudents((await listPart('students')) as { key: string; payload: Student }[])
      setSchool(((await getScalar('school')) as School) || {})
    }
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  const classMap = useMemo<Record<string, string>>(
    () => Object.fromEntries(classRows.map((c: any) => [c.key, clsName(c.payload)])),
    [classRows]
  )

  const shown = useMemo(
    () =>
      students
        .filter((s) => !cls || s.payload.classId === cls)
        .sort((a, b) => (Number(a.payload.roll) || 0) - (Number(b.payload.roll) || 0)),
    [students, cls]
  )

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="विद्यार्थी ओळखपत्र">
          <button onClick={() => window.print()} className={btnGhost}>
            🖨 प्रिंट (A4)
          </button>
        </PageHeader>

        <div className="mb-5 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">वर्ग</label>
            <select
              value={cls}
              onChange={(e) => setCls(e.target.value)}
              className="min-w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">सर्व वर्ग</option>
              {classRows.map((c: any) => (
                <option key={c.key} value={c.key}>
                  {classMap[c.key]}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-500">एकूण: {shown.length} विद्यार्थी</div>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-slate-400">या वर्गासाठी विद्यार्थी नाहीत.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-3">
          {shown.map((s) => (
            <Card
              key={s.key}
              student={s.payload}
              classLabel={s.payload.classId ? classMap[s.payload.classId] || '--' : '--'}
              school={school}
            />
          ))}
        </div>
      )}
    </div>
  )
}
