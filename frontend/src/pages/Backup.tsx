import { useState } from 'react'
import { db } from '../lib/db'
import { putItem, putScalar } from '../lib/store'
import { syncNow } from '../lib/sync'
import { importLegacyBlob } from '../lib/importBlob'
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

function isExportEnvelope(v: unknown): v is ExportEnvelope {
  return !!v && typeof v === 'object' && Array.isArray((v as { items?: unknown }).items)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function Backup() {
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)
  const [status, setStatus] = useState('')
  const [err, setErr] = useState('')

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
      setStatus(`✓ Restore पूर्ण — ${count} नोंदी परत आणल्या.`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Restore अयशस्वी')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="डेटा बॅकअप / Restore" />

      {/* Export */}
      <div className="bg-card border border-bdr rounded-xl p-5 mb-6">
        <h2 className="font-bold text-sf mb-1">बॅकअप डाउनलोड</h2>
        <p className="text-sm text-slate-500 mb-4">
          तुमचा संपूर्ण स्थानिक डेटा एका <code>.json</code> फाइलमध्ये जतन करा. ही फाइल सुरक्षित ठिकाणी
          ठेवा — गरज पडल्यास खालून Restore करता येईल.
        </p>
        <button onClick={runExport} disabled={busy !== null} className={btnPrimary + ' disabled:opacity-50'}>
          {busy === 'export' ? 'तयार होत आहे…' : '⬇ बॅकअप डाउनलोड करा'}
        </button>
      </div>

      {/* Restore */}
      <div className="bg-card border border-bdr rounded-xl p-5">
        <h2 className="font-bold text-sf mb-1">Restore करा</h2>

        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 mb-4">
          ⚠ सूचना: Restore केल्यास बॅकअपमधील नोंदी सध्याच्या स्थानिक डेटावर विलीन (merge) होतील व
          समान नोंदी अधिलिखित (overwrite) होऊ शकतात. पुढे जाण्यापूर्वी प्रथम वरून एक बॅकअप घ्या.
        </div>

        <p className="text-sm text-slate-500 mb-3">
          बॅकअप <code>.json</code> फाइल निवडा (किंवा जुन्या CCE अ‍ॅपमधील <code>cce_v76_data</code> मजकूर
          खाली पेस्ट करा) आणि "Restore करा" दाबा.
        </p>

        <input
          type="file"
          accept=".json,application/json"
          onChange={onFile}
          className="mb-3 text-sm"
        />
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='{"version":1,"items":[...]}  किंवा  {"school":{...},"students":[...]}'
          className="w-full h-32 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-xs font-mono mb-3"
        />

        <button
          onClick={runImport}
          disabled={busy !== null || !raw.trim()}
          className={btnGhost + ' disabled:opacity-50'}
        >
          {busy === 'import' ? 'Restore होत आहे…' : '⬆ Restore करा'}
        </button>

        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        {status && <p className="text-sm text-green-700 mt-3">{status}</p>}
      </div>
    </div>
  )
}
