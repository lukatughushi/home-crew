import { bookingDays, slotAvailable, slotRange, SLOTS } from '@/lib/booking'

/** Day chips + arrival-window buttons (service page sidebar and booking step 2). */
export default function DateSlotPicker({
  date,
  slot,
  onDate,
  onSlot,
  large = false,
}: {
  date: string
  slot: string | null
  onDate: (iso: string) => void
  onSlot: (slot: string) => void
  /** Booking step 2 uses bigger buttons and shows the full range ("10:00–12:00"). */
  large?: boolean
}) {
  const days = bookingDays()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        {!large && <span className="text-[13px] font-bold text-ink-500">თარიღი</span>}
        <div className={`grid gap-1.5 ${large ? 'grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2' : 'grid-cols-7'}`}>
          {days.map((d) => {
            const on = d.iso === date
            return (
              <button
                key={d.iso}
                type="button"
                aria-pressed={on}
                onClick={() => onDate(d.iso)}
                className={`flex flex-col items-center gap-0.5 border-[1.5px] py-2 ${large ? 'min-h-16 rounded-[14px]' : 'min-h-14 rounded-xl'} ${
                  on ? 'border-navy-900 bg-navy-900 text-white' : 'border-surface-200 bg-white hover:border-navy-600'
                }`}
              >
                <span className={`font-semibold ${large ? 'text-xs' : 'text-[11px]'}`}>{d.dow}</span>
                <span className={`font-extrabold ${large ? 'text-xl' : 'text-[17px]'}`}>{d.num}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {!large && <span className="text-[13px] font-bold text-ink-500">მისვლის დრო</span>}
        <div className={`grid gap-1.5 ${large ? 'grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2' : 'grid-cols-3'}`}>
          {SLOTS.map((s) => {
            const off = !slotAvailable(date, s.slot)
            const on = s.slot === slot && !off
            return (
              <button
                key={s.slot}
                type="button"
                disabled={off}
                aria-pressed={on}
                onClick={() => onSlot(s.slot)}
                className={`border-[1.5px] font-bold ${large ? 'min-h-[52px] rounded-xl text-[15px]' : 'min-h-11 rounded-[10px] text-sm'} ${
                  on
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : off
                      ? 'border-surface-200 bg-surface-50 text-mist-400 line-through'
                      : 'border-surface-200 bg-white hover:border-brand-700'
                }`}
              >
                {large ? slotRange(s.slot) : s.start}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
