import { useEffect, useMemo, useState } from 'react'
import { getScalar, putScalar } from '../lib/store'
import { syncNow } from '../lib/sync'
import { MH_DIVISIONS, talukasFor } from '../lib/mhGeo'
import { PageHeader, btnPrimary } from '../components/ui'

interface School {
  name?: string
  udise?: string
  address?: string
  dist?: string
  tal?: string
  phone?: string
  prin?: string
  med?: string
  yr?: string
  type?: string
  stdRange?: string
  estYear?: string
  schoolCode?: string
}

const YEARS = ['2023-24', '2024-25', '2025-26', '2026-27', '2027-28', '2028-29', '2029-30']
const MEDIUMS = ['मराठी', 'हिंदी', 'English', 'उर्दू']
const TYPES = ['जिल्हा परिषद', 'नगरपालिका', 'महानगरपालिका', 'खाजगी अनुदानित', 'विना अनुदानित']
const STD_RANGES: [string, string][] = [
  ['1-4', '1 ली ते 4 थी'], ['1-5', '1 ली ते 5 वी'], ['1-7', '1 ली ते 7 वी'],
  ['1-8', '1 ली ते 8 वी'], ['1-10', '1 ली ते 10 वी'], ['5-10', '5 वी ते 10 वी'], ['6-10', '6 वी ते 10 वी'],
]

export default function SchoolInfo() {
  const [form, setForm] = useState<School>({ med: 'मराठी', yr: '2026-27', type: 'जिल्हा परिषद', stdRange: '1-4' })
  const [saved, setSaved] = useState(false)
  // Fields locked once the school identity is saved (matches the original).
  const [locked, setLocked] = useState(false)

  async function load() {
    const s = (await getScalar('school')) || {}
    setForm((f) => ({ ...f, ...s }))
    setLocked(!!(s.name && s.udise))
  }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  const talukas = useMemo(() => talukasFor(form.dist || ''), [form.dist])
  const showSchoolCode = form.type === 'खाजगी अनुदानित' || form.type === 'विना अनुदानित'

  function set(k: keyof School, v: string) {
    setForm((f) => (k === 'dist' ? { ...f, dist: v, tal: '' } : { ...f, [k]: v }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) return alert('शाळेचे नाव भरा!')
    if (!form.udise?.trim()) return alert('UDISE कोड भरा!')
    if (!form.phone?.trim()) return alert('मोबाईल नंबर भरा!')
    await putScalar('school', form)
    setLocked(true)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    syncNow().catch(() => {})
    window.dispatchEvent(new Event('cce-synced'))
  }

  return (
    <form onSubmit={save}>
      <PageHeader title="🏫 शाळा माहिती">
        <button type="submit" className={btnPrimary}>{saved ? '✓ सेव्ह झाले' : '💾 सेव्ह करा'}</button>
      </PageHeader>

      <div className="bg-card border border-bdr rounded-2xl p-5 max-w-4xl">
        <div className="font-bold text-sf mb-4">शालास्तर माहिती</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
          <Field label={<>शाळेचे नाव <Req /> {locked && <Lock />}</>} v={form.name} on={(v) => set('name', v)} disabled={locked} ph="शाळेचे नाव" />
          <Field label={<>UDISE कोड <Req /> {locked && <Lock />}</>} v={form.udise} on={(v) => set('udise', v)} disabled={locked} ph="UDISE कोड" />

          <Field label="पत्ता" v={form.address} on={(v) => set('address', v)} ph="शाळेचा पत्ता" />
          <div>
            <Label>जिल्हा {locked && <Lock />}</Label>
            <select disabled={locked} value={form.dist || ''} onChange={(e) => set('dist', e.target.value)} className={sel}>
              <option value="">-- जिल्हा निवडा --</option>
              {MH_DIVISIONS.map((g) => (
                <optgroup key={g.div} label={g.div}>
                  {Object.keys(g.districts).map((d) => <option key={d} value={d}>{d}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <Label>तालुका {locked && <Lock />}</Label>
            <select disabled={locked} value={form.tal || ''} onChange={(e) => set('tal', e.target.value)} className={sel}>
              <option value="">{form.dist ? '-- तालुका निवडा --' : '-- आधी जिल्हा निवडा --'}</option>
              {talukas.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Field label={<>मोबाईल नंबर <Req /> {locked && <Lock />}</>} v={form.phone} on={(v) => set('phone', v)} disabled={locked} ph="10 अंकी मोबाईल नंबर" max={10} />

          <Field label={<>मुख्याध्यापक {locked && <Lock />}</>} v={form.prin} on={(v) => set('prin', v)} disabled={locked} ph="मुख्याध्यापकांचे नाव" />
          <SelectF label="माध्यम" v={form.med} on={(v) => set('med', v)} opts={MEDIUMS} />

          <SelectF label="शैक्षणिक वर्ष" v={form.yr} on={(v) => set('yr', v)} opts={YEARS} />
          <SelectF label="शाळा प्रकार" v={form.type} on={(v) => set('type', v)} opts={TYPES} />

          <div>
            <Label>इयत्ता श्रेणी</Label>
            <select value={form.stdRange || '1-4'} onChange={(e) => set('stdRange', e.target.value)} className={sel}>
              {STD_RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <Field label="स्थापना वर्ष" v={form.estYear} on={(v) => set('estYear', v)} ph="उदा. 1985" max={4} />

          {showSchoolCode && (
            <div className="md:col-span-2">
              <Label>शाळा संकेतांक क्रमांक</Label>
              <input value={form.schoolCode || ''} onChange={(e) => set('schoolCode', e.target.value)}
                placeholder="शाळा संकेतांक क्रमांक (खाजगी अनुदानित/विना अनुदानित)" className={inp} />
            </div>
          )}
        </div>

        {locked && (
          <p className="text-xs text-slate-500 mt-4">🔒 नाव / UDISE / जिल्हा / तालुका / मोबाईल / मुख्याध्यापक सेव्ह झाल्यानंतर बदलता येत नाहीत.</p>
        )}
      </div>
    </form>
  )
}

const inp = 'w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm disabled:bg-slate-100 disabled:text-slate-500'
const sel = inp + ' bg-white'

const Req = () => <span className="text-red-500">*</span>
const Lock = () => <span className="text-[10px] text-slate-400">🔒 बदलता येत नाही</span>
const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-slate-600 mb-1">{children}</label>
)

function Field({ label, v, on, ph, max, disabled }: { label: React.ReactNode; v?: string; on: (v: string) => void; ph?: string; max?: number; disabled?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <input value={v || ''} placeholder={ph} maxLength={max} disabled={disabled}
        onChange={(e) => on(e.target.value)} className={inp} />
    </div>
  )
}
function SelectF({ label, v, on, opts }: { label: string; v?: string; on: (v: string) => void; opts: string[] }) {
  return (
    <div>
      <Label>{label}</Label>
      <select value={v || ''} onChange={(e) => on(e.target.value)} className={sel}>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
