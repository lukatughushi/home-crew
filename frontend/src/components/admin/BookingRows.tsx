import { formatPrice } from '@/lib/format'
import { visitLabel } from '@/lib/adminFormat'
import type { AdminBooking } from '@/types/admin'
import { StatusPill } from './ui'

const FULL = 'grid-cols-[110px_minmax(0,1.2fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_110px_100px_100px_160px] min-w-[1080px]'
const COMPACT = 'grid-cols-[110px_minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1fr)_110px_150px] min-w-[760px]'

const serviceLabel = (b: AdminBooking) => `${b.service.name}${b.package ? ` · ${b.package.name}` : ''}`

/** Bookings table. `compact` = dashboard version (no pro / district columns, no header). */
export default function BookingRows({
  items,
  onOpen,
  compact = false,
}: {
  items: AdminBooking[]
  onOpen: (id: number) => void
  compact?: boolean
}) {
  const cols = compact ? COMPACT : FULL
  return (
    <div className="overflow-x-auto">
      {!compact && (
        <div className={`grid ${cols} gap-3 border-b border-surface-200 bg-[#F8FAFC] px-5 py-3 text-xs font-bold tracking-[.02em] text-ink-500`}>
          <span>ID</span>
          <span>მომხმარებელი</span>
          <span>სერვისი</span>
          <span>ხელოსანი</span>
          <span>დრო</span>
          <span>უბანი</span>
          <span>თანხა</span>
          <span>სტატუსი</span>
        </div>
      )}
      {items.map((b, i) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onOpen(b.id)}
          className={`grid w-full ${cols} min-h-14 items-center gap-3 px-5 text-left text-sm hover:bg-[#F8FAFC] ${i ? 'border-t border-surface-200' : ''} ${!compact && b.status === 'PENDING' ? 'bg-[#FFFDF7]' : 'bg-white'}`}
        >
          <span className="font-mono text-xs text-ink-500">{b.code}</span>
          <span className="truncate font-bold">{b.customerName}</span>
          <span className="truncate">{serviceLabel(b)}</span>
          {!compact && (
            <span className={`truncate ${b.pro ? '' : 'font-bold text-[#92400E]'}`}>
              {b.pro?.name ?? 'არ არის მინიჭებული'}
            </span>
          )}
          <span className="text-ink-500">{visitLabel(b.date, b.slot)}</span>
          {!compact && <span className="truncate text-ink-500">{b.district || '—'}</span>}
          <span className="font-bold">{formatPrice(b.total)}</span>
          <StatusPill status={b.status} />
        </button>
      ))}
    </div>
  )
}
