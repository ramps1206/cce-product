import { useEffect, useState } from 'react'
import { getScalar } from '../lib/store'
import { PageHeader, btnPrimary } from '../components/ui'

const DOC_TYPES = [
  'वार्षिक निकाल पत्रक',
  'प्रगती पत्रक',
  'नोंदवही',
  'विषयनिहाय श्रेणी तक्ता',
  'विस्तृत मूल्यमापन पत्रक',
]

export default function CoverPage() {
  const [school, setSchool] = useState<any>({})
  const [docType, setDocType] = useState(DOC_TYPES[0])
  const [clsDiv, setClsDiv] = useState('')

  async function load() {
    setSchool((await getScalar('school')) || {})
  }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="📕 कव्हर पेज (मुखपृष्ठ छपाई)" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Controls */}
        <div className="print:hidden lg:w-[300px] shrink-0 bg-card border border-bdr rounded-xl p-4 h-fit">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              दस्तऐवजाचा प्रकार निवडा
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
            >
              {DOC_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              इयत्ता / तुकडी (ऐच्छिक)
            </label>
            <input
              type="text"
              value={clsDiv}
              onChange={(e) => setClsDiv(e.target.value)}
              placeholder="उदा. इ. चौथी - अ"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
            />
          </div>

          <button onClick={() => window.print()} className={`${btnPrimary} w-full`}>
            🖨 मुखपृष्ठ प्रिंट करा
          </button>
        </div>

        {/* A4 cover-page preview (the print target) */}
        <div className="flex-1 flex justify-center">
          <div
            id="cover-print-area"
            className="cover-a4 bg-white border-4 border-double border-sf rounded-lg shadow-sm p-10 flex flex-col text-center"
          >
            <div className="mt-6">
              <h1 className="text-3xl font-extrabold text-sf leading-snug">
                {school.name || 'शाळेचे नाव'}
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                UDISE : {school.udise || '—'} &nbsp;|&nbsp; माध्यम : {school.med || '—'}
              </p>
            </div>

            <div className="my-8 mx-auto w-2/3 border-t-2 border-gold" />

            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-sm tracking-wide text-slate-500 mb-4">॥ दस्तऐवज ॥</p>
              <h2 className="text-5xl font-black text-slate-800 leading-tight px-4">{docType}</h2>
              {clsDiv.trim() && (
                <p className="mt-6 text-2xl font-semibold text-sf">{clsDiv.trim()}</p>
              )}
              <p className="mt-8 text-lg text-slate-700">
                शैक्षणिक वर्ष : {school.yr || '—'}
              </p>
            </div>

            <div className="mt-auto pt-8 flex justify-between text-sm text-slate-700">
              <span />
              <span className="font-semibold">
                मुख्याध्यापक : {school.prin || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cover-a4 {
          width: 210mm;
          max-width: 100%;
          min-height: 297mm;
          aspect-ratio: 210 / 297;
        }
        @media print {
          @page { size: A4; margin: 0; }
          body { background: #fff; }
          /* Only the cover preview prints. */
          body * { visibility: hidden; }
          #cover-print-area, #cover-print-area * { visibility: visible; }
          #cover-print-area {
            position: fixed;
            inset: 0;
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  )
}
