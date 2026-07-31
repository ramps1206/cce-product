import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import { listPart, nextId, putItem, removeItem } from '../lib/store'
import { useCollection } from '../lib/useCollection'
import { syncNow } from '../lib/sync'
import { PageHeader, TableCard, Td, Th, btnGhost, btnPrimary } from '../components/ui'
import { clsName } from '../lib/domain'

// Faithful to the original app's student record (openStudentModal / saveStudent).
interface Student {
  id?: string
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
  aadhaar?: string
  udiseStud?: string // PEN
  mobile?: string
  address?: string
  wt1?: string
  ht1?: string
  wt2?: string
  ht2?: string
  disabled?: string
  disabilityType?: string
  disabilityPercent?: string
  disabilityUdid?: string
  photo?: string
}

const GENDERS = ['मुलगा', 'मुलगी', 'इतर']
const CASTES = ['खुला (Open)', 'अनु.जाती (SC)', 'अनु.जमाती (ST)', 'OBC', 'SBC', 'NT-A', 'NT-B', 'NT-C', 'NT-D', 'VJA']
const MEDIUMS = ['मराठी', 'हिंदी', 'English', 'उर्दू']
const DISABILITY_TYPES = [
  'अंधत्व (Blindness)', 'अल्प दृष्टी (Low Vision)', 'कुष्ठरोग निवारित (Leprosy Cured)', 'कर्णबधिरत्व (Deaf)',
  'ऐकण्यात कमजोरी (Hard of Hearing)', 'चालण्या-फिरण्यातील अपंगत्व (Locomotor Disability)', 'बुटकेपणा (Dwarfism)',
  'बौद्धिक अक्षमता (Intellectual Disability)', 'मानसिक आजार (Mental Illness)', 'स्वमग्नता (Autism Spectrum Disorder)',
  'सेरेब्रल पाल्सी (Cerebral Palsy)', 'स्नायुंची दुर्बलता (Muscular Dystrophy)', 'चेतासंस्थेचे तीव्र आजार (Chronic Neurological Conditions)',
  'विशिष्ट अध्ययन अक्षमता (Specific Learning Disability)', 'मल्टिपल स्क्लेरोसिस (Multiple Sclerosis)',
  'वाचा व भाषा अक्षमता (Speech and Language Disability)', 'थॅलेसेमिया (Thalassemia)', 'हिमोफिलिया (Hemophilia)',
  'सिकल सेल आजार (Sickle Cell Disease)', 'बहुविकलांगत्व (Multiple Disabilities)', 'आम्ल हल्ला पीडित (Acid Attack Victim)',
  "पार्किन्सन्स आजार (Parkinson's Disease)", 'इतर (Other)',
]

export default function Students() {
  const [rows, setRows] = useState<{ key: string; payload: Student }[]>([])
  const { rows: classRows } = useCollection<any>('classes')
  const [filterCls, setFilterCls] = useState('')
  const [open, setOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [form, setForm] = useState<Student>({})
  const fileRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    const list = (await listPart('students')) as { key: string; payload: Student }[]
    list.sort((a, b) => (Number(a.payload.roll) || 0) - (Number(b.payload.roll) || 0))
    setRows(list)
  }
  useEffect(() => {
    refresh()
    const h = () => refresh()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  const classMap = useMemo(
    () => Object.fromEntries(classRows.map((c) => [c.key, clsName(c.payload)])),
    [classRows]
  )
  const shown = rows.filter((r) => !filterCls || r.payload.classId === filterCls)

  function openNew() {
    setEditKey(null)
    setForm({ gender: 'मुलगा', caste: 'खुला (Open)', med: 'मराठी', disabled: 'नाही', classId: filterCls || '' })
    setOpen(true)
  }
  function openEdit(key: string, p: Student) {
    setEditKey(key)
    setForm({ ...p })
    setOpen(true)
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result as string }))
    reader.readAsDataURL(file)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) return alert('नाव भरा!')
    if (!form.classId) return alert('वर्ग निवडा!')
    if (form.disabled === 'होय' && !form.disabilityType) return alert('दिव्यांगत्वाचा प्रकार निवडा!')
    const key = editKey ?? String(await nextId('students'))
    await putItem('students', key, { ...form, id: form.id || key })
    setOpen(false)
    await refresh()
    syncNow().catch(() => {})
  }

  async function del(key: string) {
    if (!confirm('विद्यार्थी हटवायचा?')) return
    await removeItem('students', key)
    await refresh()
    syncNow().catch(() => {})
  }

  const isDisabled = form.disabled === 'होय'

  return (
    <div>
      <PageHeader title="विद्यार्थी यादी">
        <select
          value={filterCls}
          onChange={(e) => setFilterCls(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
        >
          <option value="">सर्व वर्ग</option>
          {classRows.map((c) => (
            <option key={c.key} value={c.key}>
              {clsName(c.payload)}
            </option>
          ))}
        </select>
        <button onClick={() => api.downloadStudents().catch((e) => alert(e.message))} className={btnGhost}>
          ⬇ Excel
        </button>
        <button onClick={openNew} className={btnPrimary}>+ नवीन विद्यार्थी</button>
      </PageHeader>

      <TableCard
        head={
          <>
            <Th>फोटो</Th>
            <Th>रजि.नं</Th>
            <Th>रोल</Th>
            <Th>नाव</Th>
            <Th>वर्ग</Th>
            <Th>लिंग</Th>
            <Th>जात</Th>
            <Th> </Th>
          </>
        }
      >
        {shown.length === 0 && (
          <tr>
            <td colSpan={8} className="text-center text-slate-400 py-8">अद्याप विद्यार्थी नाहीत</td>
          </tr>
        )}
        {shown.map((r) => (
          <tr key={r.key} className="border-t border-bdr hover:bg-slate-50">
            <Td>
              {r.payload.photo ? (
                <img src={r.payload.photo} className="w-8 h-9 object-cover rounded" alt="" />
              ) : (
                <span className="text-slate-300">👤</span>
              )}
            </Td>
            <Td>{r.payload.regNo}</Td>
            <Td>{r.payload.roll}</Td>
            <Td className="font-medium">{r.payload.name}</Td>
            <Td>{classMap[r.payload.classId || ''] || '—'}</Td>
            <Td>{r.payload.gender}</Td>
            <Td>{r.payload.caste}</Td>
            <Td>
              <div className="flex gap-2 justify-end whitespace-nowrap">
                <button onClick={() => openEdit(r.key, r.payload)} className="text-sf hover:underline">संपादन</button>
                <button onClick={() => del(r.key)} className="text-red-600 hover:underline">हटवा</button>
              </div>
            </Td>
          </tr>
        ))}
      </TableCard>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-bdr sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-sf">{editKey ? 'विद्यार्थी संपादन' : 'नवीन विद्यार्थी जोडा'}</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-2xl leading-none text-slate-400">×</button>
            </div>

            <div className="p-6 space-y-3">
              {/* Photo + reg/roll/name */}
              <div className="flex gap-4 items-start">
                <div className="text-center">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-[90px] border-2 border-dashed border-[#B3D4E8] rounded-lg flex items-center justify-center bg-[#F8FCFF] cursor-pointer overflow-hidden"
                  >
                    {form.photo ? (
                      <img src={form.photo} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-3xl text-[#B3D4E8]">👤</span>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                  <div className="text-[10px] text-[#5A7A90] mt-1">फोटो क्लिक करा</div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <F label="रजिस्टर नंबर *" v={form.regNo} on={(v) => setForm({ ...form, regNo: v })} ph="नोंदणी क्रमांक" />
                    <F label="रोल नंबर" type="number" v={form.roll} on={(v) => setForm({ ...form, roll: v })} />
                  </div>
                  <F label="विद्यार्थ्याचे नाव *" v={form.name} on={(v) => setForm({ ...form, name: v })} ph="संपूर्ण नाव" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <F label="आईचे नाव" v={form.mName} on={(v) => setForm({ ...form, mName: v })} />
                <F label="जन्मतारीख" type="date" v={form.dob} on={(v) => setForm({ ...form, dob: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <S label="लिंग" v={form.gender} on={(v) => setForm({ ...form, gender: v })} opts={GENDERS} />
                <S label="जात/संवर्ग" v={form.caste} on={(v) => setForm({ ...form, caste: v })} opts={CASTES} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <S label="माध्यम" v={form.med} on={(v) => setForm({ ...form, med: v })} opts={MEDIUMS} />
                <S label="वर्ग *" v={form.classId} on={(v) => setForm({ ...form, classId: v })}
                   opts={classRows.map((c) => ({ value: c.key, label: clsName(c.payload) }))} placeholder="-- वर्ग निवडा --" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="आधार क्रमांक" v={form.aadhaar} on={(v) => setForm({ ...form, aadhaar: v })} ph="१२ अंकी आधार" max={12} />
                <F label="PEN Number" v={form.udiseStud} on={(v) => setForm({ ...form, udiseStud: v })} max={20} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="मोबाईल नंबर" v={form.mobile} on={(v) => setForm({ ...form, mobile: v })} ph="१० अंकी मोबाईल" max={10} />
                <F label="पत्ता" v={form.address} on={(v) => setForm({ ...form, address: v })} ph="पूर्ण पत्ता" />
              </div>

              <div className="text-[11.5px] font-bold text-[#1B5E84] pt-1">🩺 आरोग्यविषयक माहिती (उंची/वजन)</div>
              <div className="grid grid-cols-2 gap-3">
                <F label="सत्र १ - वजन (kg)" type="number" v={form.wt1} on={(v) => setForm({ ...form, wt1: v })} />
                <F label="सत्र १ - उंची (cm)" type="number" v={form.ht1} on={(v) => setForm({ ...form, ht1: v })} />
                <F label="सत्र २ - वजन (kg)" type="number" v={form.wt2} on={(v) => setForm({ ...form, wt2: v })} />
                <F label="सत्र २ - उंची (cm)" type="number" v={form.ht2} on={(v) => setForm({ ...form, ht2: v })} />
              </div>

              <div className="text-[11.5px] font-bold text-[#1B5E84] pt-1">🧑‍🦽 दिव्यांगत्व (अपंगत्व) विषयी माहिती</div>
              <div className="grid grid-cols-2 gap-3">
                <S label="विद्यार्थी अपंग आहे काय?" v={form.disabled} on={(v) => setForm({ ...form, disabled: v })} opts={['नाही', 'होय']} />
                {isDisabled && (
                  <S label="दिव्यांगत्वाचा प्रकार *" v={form.disabilityType} on={(v) => setForm({ ...form, disabilityType: v })}
                     opts={DISABILITY_TYPES} placeholder="-- प्रकार निवडा --" />
                )}
              </div>
              {isDisabled && (
                <div className="grid grid-cols-2 gap-3">
                  <F label="दिव्यांगत्व टक्केवारी (%)" type="number" v={form.disabilityPercent} on={(v) => setForm({ ...form, disabilityPercent: v })} ph="उदा. 40" />
                  <F label="UDID / प्रमाणपत्र क्रमांक" v={form.disabilityUdid} on={(v) => setForm({ ...form, disabilityUdid: v })} />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end px-6 py-4 border-t border-bdr sticky bottom-0 bg-white rounded-b-2xl">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm border border-slate-300">रद्द</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-sf text-white">💾 सेव्ह</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function F({ label, v, on, type = 'text', ph, max }: { label: string; v?: string; on: (v: string) => void; type?: string; ph?: string; max?: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type={type} value={v || ''} placeholder={ph} maxLength={max}
        onChange={(e) => on(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
      />
    </div>
  )
}

function S({ label, v, on, opts, placeholder }: { label: string; v?: string; on: (v: string) => void; opts: (string | { value: string; label: string })[]; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <select value={v || ''} onChange={(e) => on(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-sf outline-none text-sm">
        {placeholder && <option value="">{placeholder}</option>}
        {opts.map((o) => {
          const val = typeof o === 'string' ? o : o.value
          const lbl = typeof o === 'string' ? o : o.label
          return <option key={val} value={val}>{lbl}</option>
        })}
      </select>
    </div>
  )
}
