// Small building blocks shared by the admin pages (styles from HomeCrew Admin.dc.html).
import type { ReactNode } from 'react'
import { STATUS } from '@/lib/adminFormat'
import type { BookingStatus } from '@/types/admin'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-surface-200 bg-white ${className}`}>{children}</div>
}

export function StatusPill({ status }: { status: BookingStatus }) {
  const [label, bg, fg] = STATUS[status]
  return <Pill bg={bg} fg={fg}>{label}</Pill>
}

export function Pill({ children, bg, fg }: { children: ReactNode; bg: string; fg: string }) {
  return (
    <span
      className="justify-self-start rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  )
}

export function Toggle({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean
  onChange: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`flex h-7 w-12 shrink-0 rounded-full p-[3px] transition-colors disabled:opacity-50 ${on ? 'justify-end bg-brand-700' : 'justify-start bg-surface-300'}`}
    >
      <span className="size-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)]" />
    </button>
  )
}

export function KpiCard({ label, value, note, noteColor = '#5A6A80' }: { label: string; value: ReactNode; note?: string; noteColor?: string }) {
  return (
    <Card className="flex flex-col gap-1.5 px-5 py-[18px]">
      <span className="text-[13px] font-semibold text-ink-500">{label}</span>
      <span className="text-[28px] font-extrabold tracking-tight">{value}</span>
      {note && (
        <span className="text-xs font-bold" style={{ color: noteColor }}>
          {note}
        </span>
      )}
    </Card>
  )
}

export function Avatar({ initials, size = 34, dark = false }: { initials: string; size?: number; dark?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-extrabold ${dark ? 'bg-navy-900 text-white' : 'bg-brand-50 text-brand-700'}`}
      style={{ width: size, height: size, fontSize: size < 40 ? 12 : 14 }}
    >
      {initials}
    </span>
  )
}

/** Loading / error / empty placeholder for a section. */
export function StateBox({ children }: { children: ReactNode }) {
  return <Card className="px-5 py-10 text-center text-sm text-ink-500">{children}</Card>
}

export function SegmentTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div role="tablist" className="flex gap-1 self-start rounded-xl bg-surface-200 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`min-h-10 rounded-[9px] px-4 text-sm font-bold ${value === t.id ? 'bg-white shadow-[0_1px_3px_rgba(11,31,58,.12)]' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export const primaryBtn =
  'min-h-11 rounded-[10px] bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-[#9AA8BA]'
export const secondaryBtn =
  'min-h-11 rounded-[10px] border border-surface-300 bg-white px-4 text-sm font-bold text-navy-900 hover:border-navy-900 disabled:opacity-50'
export const dangerLink = 'min-h-11 px-2 text-sm font-bold text-[#B42318] hover:underline disabled:opacity-50'
