import { BOOKING_FEE } from '@/lib/booking'
import { formatPrice } from '@/lib/format'

/** Small shared pieces of the service page and booking flow. */

export function Radio({ on }: { on: boolean }) {
  return (
    <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-brand-700' : 'border-surface-300'}`}>
      <span className={`size-2.5 rounded-full ${on ? 'bg-brand-700' : ''}`} />
    </span>
  )
}

export function PriceLines({ pkgName, price, big = false }: { pkgName?: string; price: number; big?: boolean }) {
  return (
    <div className="flex flex-col gap-2 border-t border-dashed border-surface-300 pt-4 text-sm">
      <div className="flex justify-between gap-3 text-ink-500">
        <span>{pkgName ? `პაკეტი „${pkgName}“` : 'პაკეტი'}</span>
        <span>{formatPrice(price)}</span>
      </div>
      <div className="flex justify-between gap-3 text-ink-500">
        <span>ჯავშნისა და დაზღვევის საფასური</span>
        <span>{formatPrice(BOOKING_FEE)}</span>
      </div>
      <div className={`mt-1 flex justify-between font-extrabold ${big ? 'text-[17px]' : 'text-base'}`}>
        <span>სულ</span>
        <span>{formatPrice(price + BOOKING_FEE)}</span>
      </div>
    </div>
  )
}
