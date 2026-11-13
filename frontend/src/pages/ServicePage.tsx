import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DateSlotPicker from '@/components/booking/DateSlotPicker'
import Icon from '@/components/ui/Icon'
import { trust } from '@/content/home'
import { serviceFaqs } from '@/content/service'
import { useServices } from '@/hooks/useServices'
import { BOOKING_FEE, firstOpenDay, SLOTS } from '@/lib/booking'
import { PriceLines, Radio } from '@/components/booking/BookingBits'
import { formatCount, formatPrice } from '@/lib/format'
import { getServicePros } from '@/services/api'
import type { ServiceCategory } from '@/types'

const placeholder = 'bg-[repeating-linear-gradient(135deg,#E3E8EF_0_12px,#EDF1F5_12px_24px)] grid place-items-center font-mono text-xs text-ink-500'

export default function ServicePage() {
  const { id = '' } = useParams()
  const { services, loading, error } = useServices()
  const service = services.find((s) => s.id === id)

  if (loading) return <p className="mx-auto max-w-[1200px] px-5 py-16 text-ink-500">იტვირთება…</p>
  if (error) return <p className="mx-auto max-w-[1200px] px-5 py-16 text-ink-500">სერვისი ვერ ჩაიტვირთა — სცადე გვერდის განახლება.</p>
  if (!service) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <p className="text-ink-500">სერვისი ვერ მოიძებნა.</p>
        <Link to="/" className="mt-3 inline-block font-bold text-brand-700 hover:underline">
          მთავარზე დაბრუნება
        </Link>
      </div>
    )
  }
  // key: reset picks when moving between services
  return <ServiceDetail key={service.id} service={service} />
}

function ServiceDetail({ service }: { service: ServiceCategory }) {
  const navigate = useNavigate()
  const popular = service.packages.findIndex((p) => p.isPopular)
  const [pkgIndex, setPkgIndex] = useState(popular >= 0 ? popular : 0)
  const [date, setDate] = useState(firstOpenDay)
  const [slot, setSlot] = useState<string | null>(null)
  const [faq, setFaq] = useState(0)
  const { data: pros = [] } = useQuery({ queryKey: ['service-pros', service.id], queryFn: () => getServicePros(service.id) })

  const pkg = service.packages[pkgIndex]
  const total = pkg ? pkg.price + BOOKING_FEE : 0

  const startBooking = () => {
    if (!pkg) return
    const q = new URLSearchParams({ package: String(pkg.id), date, ...(slot && { slot }) })
    navigate(`/book/${service.id}?${q}`)
  }
  const slotStart = SLOTS.find((s) => s.slot === slot)?.start

  return (
    <>
      <div className="mx-auto max-w-[1200px] px-5 pt-5 pb-16">
        <nav className="mb-4 flex flex-wrap gap-2 text-[13px] text-ink-500" aria-label="ნავიგაცია">
          <Link to="/" className="hover:text-brand-700">
            მთავარი
          </Link>
          <span>/</span>
          <span>{service.name}</span>
          <span>/</span>
          <span className="font-semibold text-navy-900">{service.service}</span>
        </nav>

        <div className="flex flex-wrap items-start gap-8">
          <main className="flex min-w-0 flex-[1_1_560px] flex-col gap-8">
            {/* Photo (from admin → სურათები) + before/after placeholders on wide screens */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
              {service.photoUrl ? (
                <img src={service.photoUrl} alt={service.photo || service.service} className="col-span-2 h-[300px] w-full rounded-panel bg-surface-200 object-cover" />
              ) : (
                <div className={`col-span-2 h-[300px] rounded-panel ${placeholder}`}>ფოტო: {service.photo || service.service}</div>
              )}
              <div className="hidden gap-2 lg:grid">
                <div className={`rounded-card ${placeholder}`}>მანამდე</div>
                <div className={`rounded-card ${placeholder}`}>შემდეგ</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="self-start rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-700">{service.name}</span>
              <h1 className="text-[clamp(28px,4vw,40px)] leading-[1.1] font-extrabold tracking-[-.025em]">{service.service}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-500">
                {service.rating !== null && (
                  <span className="font-bold text-navy-900">
                    <span className="text-star">★</span> {service.rating.toFixed(2)}
                  </span>
                )}
                {service.reviews > 0 && <span>{formatCount(service.reviews)} შეფასება</span>}
                {service.reviews > 0 && <span>·</span>}
                <span>{service.pros} შემოწმებული ხელოსანი ახლოს</span>
              </div>
              <p className="max-w-[640px] text-base leading-[1.65] text-pretty text-ink-600">{service.description}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {trust.map((t) => (
                  <span key={t.title} className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-3 py-2 text-[13px] font-semibold">
                    <Icon path={t.icon} size={16} strokeWidth={2} className="text-brand-700" />
                    {t.title}
                  </span>
                ))}
              </div>
            </div>

            <section className="flex flex-col gap-3.5">
              <h2 className="text-[22px] font-extrabold tracking-tight">აირჩიე პაკეტი</h2>
              {service.packages.length === 0 ? (
                <p className="text-ink-500">ამ სერვისს პაკეტები ჯერ არ აქვს.</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3" role="radiogroup" aria-label="პაკეტი">
                  {service.packages.map((p, i) => {
                    const on = i === pkgIndex
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setPkgIndex(i)}
                        className={`relative flex flex-col gap-2 rounded-card border-2 p-[18px] text-left ${on ? 'border-brand-700 bg-[#F0FAF5]' : 'border-surface-200 bg-white hover:border-surface-300'}`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-base font-bold">{p.name}</span>
                          <Radio on={on} />
                        </span>
                        <span className="text-2xl font-extrabold tracking-tight">{formatPrice(p.price)}</span>
                        <span className="text-[13px] leading-normal text-ink-500">{p.description}</span>
                        {p.isPopular && (
                          <span className="absolute -top-[11px] right-3.5 rounded-full bg-navy-900 px-2.5 py-1 text-[11px] font-bold text-white">პოპულარული</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>

            {(service.included.length > 0 || service.excluded.length > 0) && (
              <section className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 rounded-panel border border-surface-200 bg-white p-6">
                <div className="flex flex-col gap-3">
                  <h3 className="text-[17px] font-bold">რა შედის</h3>
                  {service.included.map((i) => (
                    <div key={i} className="flex gap-2.5 text-[15px] leading-snug">
                      <span className="font-extrabold text-brand-700">✓</span>
                      {i}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-[17px] font-bold">რა არ შედის</h3>
                  {service.excluded.map((i) => (
                    <div key={i} className="flex gap-2.5 text-[15px] leading-snug text-ink-500">
                      <span className="font-extrabold">–</span>
                      {i}
                    </div>
                  ))}
                  <p className="mt-2 text-[13px] leading-normal text-ink-500">დამატებითი სამუშაო ფასდება აპში და საჭიროებს შენს თანხმობას.</p>
                </div>
              </section>
            )}

            {pros.length > 0 && (
              <section className="flex flex-col gap-3.5">
                <h2 className="text-[22px] font-extrabold tracking-tight">საუკეთესო ხელოსნები შენს მახლობლად</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                  {pros.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex flex-col gap-3 rounded-card border border-surface-200 bg-white p-[18px]">
                      <div className="flex items-center gap-3">
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-navy-900 text-[15px] font-extrabold text-white">{p.initials}</span>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-[15px] font-bold">{p.name}</span>
                          <span className="text-[13px] text-ink-500">
                            {p.rating !== null && (
                              <>
                                <span className="text-star">★</span> {p.rating.toFixed(2)} ·{' '}
                              </>
                            )}
                            {p.jobs} სამუშაო
                          </span>
                        </span>
                      </div>
                      {p.tag && <span className="self-start rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">{p.tag}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="flex flex-col gap-2">
              <h2 className="mb-1.5 text-[22px] font-extrabold tracking-tight">ხშირი კითხვები</h2>
              {serviceFaqs.map((f, i) => {
                const open = faq === i
                return (
                  <div key={f.q} className="rounded-[14px] border border-surface-200 bg-white">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setFaq(open ? -1 : i)}
                      className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-[18px] text-left text-[15px] font-bold"
                    >
                      {f.q}
                      <span className="text-xl font-medium text-brand-700" aria-hidden="true">
                        {open ? '−' : '+'}
                      </span>
                    </button>
                    {open && <p className="px-5 pb-[18px] text-[15px] leading-relaxed text-ink-500">{f.a}</p>}
                  </div>
                )
              })}
            </section>
          </main>

          {/* Booking card */}
          {pkg && (
            <aside className="sticky top-[88px] flex max-w-[400px] min-w-0 flex-[1_1_320px] flex-col gap-5 self-start rounded-panel border border-surface-200 bg-white p-6 shadow-[0_8px_32px_rgba(11,31,58,.06)]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-bold">{pkg.name}</span>
                <span className="text-[28px] font-extrabold tracking-tight">{formatPrice(pkg.price)}</span>
              </div>
              <DateSlotPicker
                date={date}
                slot={slot}
                onDate={(d) => {
                  setDate(d)
                  setSlot(null)
                }}
                onSlot={setSlot}
              />
              <PriceLines pkgName={pkg.name} price={pkg.price} />
              <button
                type="button"
                onClick={startBooking}
                className="min-h-[54px] rounded-xl bg-brand-700 text-base font-extrabold text-white hover:bg-brand-800"
              >
                {slotStart ? `დაჯავშნა · ${slotStart}` : 'დაჯავშნის გაგრძელება'}
              </button>
              <p className="text-center text-[13px] leading-normal text-ink-500">
                თანხა ჩამოიჭრება დასრულების შემდეგ · უფასო გაუქმება 24 სთ-ით ადრე
              </p>
            </aside>
          )}
        </div>
      </div>

      {/* Phone: sticky bottom bar */}
      {pkg && (
        <div className="sticky bottom-0 z-20 flex items-center gap-3 border-t border-surface-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(11,31,58,.08)] lg:hidden">
          <span className="flex flex-1 flex-col">
            <span className="text-xs text-ink-500">{pkg.name}</span>
            <span className="text-xl font-extrabold">{formatPrice(total)}</span>
          </span>
          <button type="button" onClick={startBooking} className="min-h-[50px] rounded-xl bg-brand-700 px-6 text-base font-extrabold text-white">
            დაჯავშნა
          </button>
        </div>
      )}
    </>
  )
}
