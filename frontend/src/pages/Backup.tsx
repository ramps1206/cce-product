import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import { listPart, putItem, putScalar } from '../lib/store'
import { syncNow } from '../lib/sync'
import { importLegacyBlob } from '../lib/importBlob'
import { useCollection } from '../lib/useCollection'
import { clsName } from '../lib/domain'
import { PageHeader, btnGhost, btnPrimary } from '../components/ui'

/** Our own export envelope: the raw local Item list, versioned. */
interface ExportEnvelope {
  version: number
  exportedAt: string
  items: ExportItem[]
}
interface ExportItem {
  part: string
  key: string
  payload: unknown
  deleted?: number | boolean
}

/** Scalar parts are stored under a single reserved key ('_'). */
const SCALAR_PARTS = ['school', 'workingDays', 'settings']
const LAST_BACKUP_KEY = 'cce_last_backup'

function isExportEnvelope(v: unknown): v is ExportEnvelope {
  return !!v && typeof v === 'object' && Array.isArray((v as { items?: unknown }).items)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return 'अद्याप बॅकअप घेतलेला नाही'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'अद्याप बॅकअप घेतलेला नाही'
  return d.toLocaleString('mr-IN')
}

interface Student {
  name?: string
  classId?: string | number
  [k: string]: unknown
}

export default function Backup() {
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)
  const [status, setStatus] = useState('')
  const [err, setErr] = useState('')
  const [lastBackup, setLastBackup] = useState<string | null>(
    () => localStorage.getItem(LAST_BACKUP_KEY)
  )

  // Stats counts
  const [counts, setCounts] = useState({
    students: 0,
    classes: 0,
    assessments: 0,
    teachers: 0,
  })

  // Orphan detection uses live collections.
  const { rows: students } = useCollection<Student>('students')
  const { rows: classes } = useCollection<any>('classes')

  const [checkedOrphans, setCheckedOrphans] = useState(false)

  async function refreshCounts() {
    const [st, cl, as, te] = await Promise.all([
      listPart('students'),
      listPart('classes'),
      listPart('assessments'),
      listPart('teachers'),
    ])
    setCounts({
      students: st.length,
      classes: cl.length,
      assessments: as.length,
      teachers: te.length,
    })
  }

  useEffect(() => {
    refreshCounts()
    const h = () => refreshCounts()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  const classKeys = new Set(classes.map((c) => String(c.key)))
  const orphans = checkedOrphans
    ? students.filter((s) => {
        const cid = s.payload?.classId
        return cid == null || !classKeys.has(String(cid))
      })
    : []

  async function reassignOrphan(studentKey: string, payload: Student, newClassKey: string) {
    setErr('')
    setStatus('')
    try {
      await putItem('students', studentKey, { ...payload, classId: newClassKey })
      syncNow().catch(() => {})
      window.dispatchEvent(new Event('cce-synced'))
      setStatus('✓ विद्यार्थी नवीन वर्गात हलवला.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'पुनर्नियुक्ती अयशस्वी')
    }
  }

  async function runExport() {
    setErr('')
    setStatus('')
    setBusy('export')
    try {
      const items = await db.items.toArray()
      const envelope: ExportEnvelope = {
        version: 1,
        exportedAt: new Date().toISOString(),
        items,
      }
      const blob = new Blob([JSON.stringify(envelope, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cce-backup-${today()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      const now = new Date().toISOString()
      localStorage.setItem(LAST_BACKUP_KEY, now)
      setLastBackup(now)
      setStatus(`✓ ${items.length} नोंदींची बॅकअप फाइल डाउनलोड झाली.`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'बॅकअप डाउनलोड अयशस्वी')
    } finally {
      setBusy(null)
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setRaw(await f.text())
  }

  /** Restore our own export envelope: replay each item back into the store. */
  async function restoreEnvelope(env: ExportEnvelope): Promise<number> {
    let count = 0
    for (const it of env.items) {
      if (!it || typeof it.part !== 'string' || typeof it.key !== 'string') continue
      // Skip tombstones — a restore should bring back live data, not delete it.
      if (it.deleted) continue
      if (SCALAR_PARTS.includes(it.part) || it.key === '_') {
        await putScalar(it.part, it.payload)
      } else {
        await putItem(it.part, it.key, it.payload)
      }
      count++
    }
    await syncNow()
    return count
  }

  async function runImport() {
    setErr('')
    setStatus('')
    setBusy('import')
    try {
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        throw new Error('अवैध JSON — कृपया वैध बॅकअप फाइल निवडा किंवा मजकूर पेस्ट करा')
      }
      if (!parsed || typeof parsed !== 'object') throw new Error('अवैध डेटा')

      let count: number
      if (isExportEnvelope(parsed)) {
        count = await restoreEnvelope(parsed)
      } else {
        // Fall back to the legacy cce_v76_data blob importer.
        const r = await importLegacyBlob(raw)
        count = r.total
      }

      window.dispatchEvent(new Event('cce-synced'))
      await refreshCounts()
      setStatus(`✓ Restore पूर्ण — ${count} नोंदी परत आणल्या.`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Restore अयशस्वी')
    } finally {
      setBusy(null)
    }
  }

  async function clearAll() {
    if (!window.confirm('⚠️ सर्व स्थानिक डेटा कायमचा साफ करायचा? ही कृती पूर्ववत करता येणार नाही.'))
      return
    if (!window.confirm('खरंच? सर्व विद्यार्थी, वर्ग व मूल्यमापन नोंदी हटवल्या जातील. पुष्टी करा.'))
      return
    await db.items.clear()
    window.location.reload()
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="💾 डेटा बॅकअप" />

      {/* Backup status + actions */}
      <div className="bg-card border border-bdr rounded-xl p-5 mb-6">
        <h2 className="font-bold text-sf mb-1">संपूर्ण बॅकअप स्थिती</h2>
        <p className="text-sm text-slate-500 mb-4">
          शेवटचा बॅकअप: <span className="font-semibold text-sf">{fmtDateTime(lastBackup)}</span>
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={runExport}
            disabled={busy !== null}
            className={btnPrimary + ' disabled:opacity-50'}
          >
            {busy === 'export' ? 'तयार होत आहे…' : '⬇ आत्ता बॅकअप घ्या'}
          </button>

          <label className={btnGhost + ' cursor-pointer inline-flex items-center'}>
            ⬆ बॅकअप पुनर्स्थापित करा
            <input
              type="file"
              accept=".json,application/json"
              onChange={onFile}
              className="hidden"
            />
          </label>

          {raw.trim() && (
            <button
              onClick={runImport}
              disabled={busy !== null}
              className={btnPrimary + ' disabled:opacity-50'}
            >
              {busy === 'import' ? 'पुनर्स्थापित होत आहे…' : '✓ पुनर्स्थापना सुरू करा'}
            </button>
          )}
        </div>

        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='{"version":1,"items":[...]}  किंवा जुन्या CCE अ‍ॅपमधील मजकूर पेस्ट करा'
          className="w-full h-24 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-xs font-mono mb-3"
        />

        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3">
          ⚠️ बॅकअप फाईल सुरक्षित ठिकाणी जतन करा (Google Drive / Pen Drive).
        </div>

        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        {status && <p className="text-sm text-green-700 mt-3">{status}</p>}
      </div>

      {/* Stats */}
      <div className="bg-card border border-bdr rounded-xl p-4 mb-6 text-sm text-sf">
        📊 एकूण: {counts.students} विद्यार्थी | {counts.classes} वर्ग | {counts.assessments}{' '}
        मूल्यमापन नोंदी | {counts.teachers} शिक्षक
      </div>

      {/* Clear all */}
      <div className="bg-card border border-bdr rounded-xl p-5 mb-6">
        <button
          onClick={clearAll}
          className="px-3 py-2 rounded-lg text-sm border border-red-300 text-red-600 hover:bg-red-50"
        >
          🗑 सर्व डेटा साफ
        </button>
      </div>

      {/* Orphaned students */}
      <div className="bg-card border border-bdr rounded-xl p-5">
        <h2 className="font-bold text-sf mb-1">🔍 हरवलेले / अनाथ विद्यार्थी शोधा (Orphaned Students)</h2>
        <p className="text-sm text-slate-500 mb-3">
          ज्या विद्यार्थ्यांचा वर्ग अस्तित्वात नाही अशा नोंदी शोधा व त्यांना योग्य वर्गात पुन्हा नेमा.
        </p>

        <button onClick={() => setCheckedOrphans(true)} className={btnGhost}>
          तपासा
        </button>

        {checkedOrphans && (
          <div className="mt-4">
            {orphans.length === 0 ? (
              <p className="text-sm text-green-700">✓ कोणतेही अनाथ विद्यार्थी आढळले नाहीत.</p>
            ) : (
              <ul className="space-y-2">
                {orphans.map((s) => (
                  <li
                    key={s.key}
                    className="flex flex-wrap items-center gap-2 border border-bdr rounded-lg p-2 text-sm"
                  >
                    <span className="font-semibold text-sf">
                      {s.payload?.name || `विद्यार्थी #${s.key}`}
                    </span>
                    <span className="text-red-600 text-xs">
                      (हरवलेला वर्ग: {String(s.payload?.classId ?? '—')})
                    </span>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) reassignOrphan(s.key, s.payload, e.target.value)
                      }}
                      className="ml-auto px-2 py-1 rounded-lg border border-slate-300 bg-slate-50 text-sm"
                    >
                      <option value="" disabled>
                        वर्ग निवडा…
                      </option>
                      {classes.map((c) => (
                        <option key={c.key} value={c.key}>
                          {clsName(c.payload)}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
