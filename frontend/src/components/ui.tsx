import type { ReactNode } from 'react'

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
      />
    </div>
  )
}

export function Modal({
  title,
  onClose,
  onSubmit,
  children,
}: {
  title: string
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl p-6 w-full max-w-[380px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-lg font-bold text-sf mb-4">{title}</h2>
        {children}
        <div className="flex gap-2 justify-end mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-slate-300">
            रद्द
          </button>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-sf text-white">
            जतन करा
          </button>
        </div>
      </form>
    </div>
  )
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h1 className="text-2xl font-bold text-sf">{title}</h1>
      <div className="flex gap-2">{children}</div>
    </div>
  )
}

export const btnPrimary = 'px-3 py-2 rounded-lg text-sm bg-sf text-white hover:bg-sf/90'
export const btnGhost = 'px-3 py-2 rounded-lg text-sm border border-sf text-sf hover:bg-sf/5'

export const Th = ({ children }: { children: ReactNode }) => (
  <th className="text-left font-semibold px-4 py-2.5">{children}</th>
)
export const Td = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <td className={`px-4 py-2.5 ${className}`}>{children}</td>
)

export function TableCard({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-card border border-bdr rounded-xl overflow-x-auto">
      <table className="w-full text-sm min-w-[520px]">
        <thead className="bg-sf/5 text-sf">
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
