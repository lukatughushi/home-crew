import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AuthForm from '@/components/auth/AuthForm'
import { PriceLines, Radio } from '@/components/booking/BookingBits'
import DateSlotPicker from '@/components/booking/DateSlotPicker'
import Icon from '@/components/ui/Icon'
import { icons } from '@/content/home'
import { ME_KEY, useMe } from '@/hooks/useMe'
import { useServices } from '@/hooks/useServices'
import { BOOKING_FEE, bookingDays, firstOpenDay, longDay, PROPERTY_TYPES, shortDay, slotAvailable, slotRange } from '@/lib/booking'
import { formatPrice } from '@/lib/format'
import { createBooking, getServicePros } from '@/services/api'
import type { CreatedBooking, PropertyType, ServiceCategory } from '@/types'

const STEPS = ['დეტალები', 'დრო', 'ხელოსანი', 'გადახდა', 'მზადაა']
const field = 'min-h-[52px] rounded-xl border-[1.5px] border-surface-300 px-3.5 text-base font-normal text-navy-900 outline-brand-700'
const pickCls = (on: boolean) => (on ? 'border-brand-700 bg-[#F0FAF5]' : 'border-surface-200 bg-white hover:border-surface-300')

function bookingError(err: unknown): string {
  if (isAxiosError(err)) {
    if (!err.response) return 'სერვერთან კავშირი ვერ დამყარდა'
    const status = err.response.status
    if (status === 402) return 'ბალანსზე საკმარისი თანხა არ არის'
    if (status === 401) return 'სესია ამოიწურა — შედი თავიდან'
    if (status === 400) return 'ეს დრო უკვე აღარ არის ხელმისაწვდომი — აირჩიე სხვა'
  }
  return 'ჯავშანი ვერ შეიქმნა — სცადე თავიდან'
}

export default function BookingPage() {
  const { id = '' } = useParams()
  const { services, loading } = useServices()
  const service = services.find((s) => s.id === id)

  if (loading) return <p className="mx-auto max-w-[1100px] px-5 py-16 text-ink-500">იტვირთება…</p>
  if (!service || service.packages.length === 0) {
    return (
      <div className="mx-auto max-w-[1100px] px-5 py-16">
        <p className="text-ink-500">ეს სერვისი ახლა ვერ დაიჯავშნება.</p>
        <Link to="/" className="mt-3 inline-block font-bold text-brand-700 hover:underline">
          მთავარზე დაბრუნება
        </Link>
      </div>
    )
  }
  return <Booking service={service} />
}

function Booking({ service }: { service: ServiceCategory }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const { me } = useMe()
  const { data: pros = [] } = useQuery({ queryKey: ['service-pros', service.id], queryFn: () => getServicePros(service.id) })

  // Picks from the service page arrive in the URL (?package=&date=&slot=).
  const initialPkg = service.packages.find((p) => String(p.id) === params.get('package')) ?? service.packages.find((p) => p.isPopular) ?? service.packages[0]
  const initialDate = bookingDays().some((d) => d.iso === params.get('date')) ? params.get('date')! : firstOpenDay()
  const initialSlot = params.get('slot')

  const [step, setStep] = useState(1)
  const [pkgId] = useState(initialPkg.id)
  const [address, setAddress] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>('APARTMENT')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(initialDate)
  const [slot, setSlot] = useState<string | null>(initialSlot && slotAvailable(initialDate, initialSlot) ? initialSlot : null)
  const [proId, setProId] = useState<number | null>(null) // null = "best match"
  const [phoneEdit, setPhoneEdit] = useState<string | null>(null)
  const [done, setDone] = useState<CreatedBooking | null>(null)

  const pkg = service.packages.find((p) => p.id === pkgId)!
  const total = pkg.price + BOOKING_FEE
  const pro = pros.find((p) => p.id === proId) ?? null
  const phone = phoneEdit ?? me?.phone ?? ''
  const enoughMoney = !!me && me.balance >= total

  const pay = useMutation({
    mutationFn: () =>
      createBooking({
        serviceId: service.id,
        packageId: pkg.id,
        proId: proId ?? undefined,
        phone: phone.trim(),
        address: address.trim(),
        propertyType,
        notes: notes.trim(),
        date,
        slot: slot!,
      }),
    onSuccess: (b) => {
      setDone(b)
      setStep(5)
      qc.invalidateQueries({ queryKey: ME_KEY }) // balance changed
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
      window.scrollTo(0, 0)
    },
  })

  const cantNext =
    (step === 1 && address.trim().length < 3) ||
    (step === 2 && (!slot || !slotAvailable(date, slot))) ||
    (step === 4 && (!me || phone.trim().length < 5 || !enoughMoney || pay.isPending))

  const next = () => {
    if (cantNext) return
    if (step === 4) return pay.mutate()
    if (step === 5) return navigate('/account')
    setStep(step + 1)
    window.scrollTo(0, 0)
  }
  const back = () => {
    if (step === 1) return navigate(`/services/${service.id}`)
    if (step === 5) return navigate('/')
    setStep(step - 1)
  }

  const summary = [
    { k: 'თარიღი', v: shortDay(date) },
    { k: 'მისვლა', v: slot ? slotRange(slot) : null, empty: 'არ არის არჩეული' },
    { k: 'მისამართი', v: address.trim() || null, empty: 'არ არის მითითებული' },
    { k: 'ხელოსანი', v: pro?.name ?? 'საუკეთესო შერჩევა' },
  ]

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-5 pt-6 pb-16">
      {/* Stepper */}
      <ol className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((label, i) => {
          const n = i + 1
          const isDone = n < step
          const cur = n === step
          return (
            <li key={label} className="flex flex-[1_0_auto] items-center gap-2" aria-current={cur ? 'step' : undefined}>
              <span
                className={`grid size-[30px] shrink-0 place-items-center rounded-full border-[1.5px] text-[13px] font-extrabold ${
                  isDone ? 'border-brand-700 bg-brand-700 text-white' : cur ? 'border-navy-900 bg-navy-900 text-white' : 'border-surface-300 bg-white text-ink-500'
                }`}
              >
                {isDone ? '✓' : n}
              </span>
              <span className={`text-sm font-bold whitespace-nowrap ${cur || isDone ? '' : 'text-ink-500'}`}>{label}</span>
              {n < STEPS.length && <span className={`h-0.5 min-w-4 flex-1 rounded ${isDone ? 'bg-brand-700' : 'bg-surface-200'}`} />}
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-6 rounded-panel border border-surface-200 bg-white p-5 sm:p-7">
          {step === 1 && (
            <>
              <StepTitle title="სად არის სამუშაო?" sub="გაჩვენებთ მხოლოდ შენს უბანში მომუშავე ხელოსნებს." />
              <label className="flex flex-col gap-2 text-sm font-bold">
                მისამართი
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ქუჩა, სახლი, ქალაქი" autoComplete="street-address" maxLength={200} className={field} />
              </label>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold">ობიექტის ტიპი</span>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={propertyType === p.id}
                      onClick={() => setPropertyType(p.id)}
                      className={`min-h-11 rounded-full border-[1.5px] px-[18px] text-sm font-bold ${pickCls(propertyType === p.id)}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex flex-col gap-2 text-sm font-bold">
                შენიშვნა ხელოსნისთვის
                <span className="-mt-1 text-[13px] font-medium text-ink-500">არასავალდებულო — შესასვლელი, პარკინგი, შინაური ცხოველები</span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  placeholder="მაგ. გასაღები მეზობელთან, მეგობრული ძაღლი"
                  className={`${field} resize-y py-3 text-[15px]`}
                />
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <StepTitle title="როდის გაწყობს?" sub="აირჩიე მისვლის დრო — ხელოსანი 15 წუთში დაადასტურებს." />
              <DateSlotPicker
                large
                date={date}
                slot={slot}
                onDate={(d) => {
                  setDate(d)
                  setSlot(null)
                }}
                onSlot={setSlot}
              />
            </>
          )}

          {step === 3 && (
            <>
              <StepTitle title="აირჩიე ხელოსანი" sub="ფასი ერთნაირია, ვინც არ უნდა აირჩიო. ყველა შემოწმებული და დაზღვეულია." />
              <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="ხელოსანი">
                {[null, ...pros].map((p) => {
                  const on = (p?.id ?? null) === proId
                  return (
                    <button
                      key={p?.id ?? 'best'}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setProId(p?.id ?? null)}
                      className={`flex min-h-[68px] items-center gap-3.5 rounded-[14px] border-[1.5px] px-4 py-3.5 text-left ${pickCls(on)}`}
                    >
                      <span className={`grid size-11 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white ${p ? 'bg-navy-900' : 'bg-brand-700'}`}>
                        {p ? p.initials : '★'}
                      </span>
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span className="text-[15px] font-bold">{p ? p.name : 'საუკეთესო შერჩევა (რეკომენდებული)'}</span>
                        <span className="text-[13px] text-ink-500">
                          {p
                            ? [p.rating !== null ? `★ ${p.rating.toFixed(2)}` : null, `${p.jobs} სამუშაო`, p.tag || null].filter(Boolean).join(' · ')
                            : 'უსწრაფესი დადასტურება · მაღალი რეიტინგი'}
                        </span>
                      </span>
                      <Radio on={on} />
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <StepTitle
                title="გადახედე და გადაიხადე"
                sub="თანხას ახლა ვბლოკავთ და ჩამოგეჭრება მხოლოდ მაშინ, როცა სამუშაოს დასრულებულად მონიშნავ."
              />
              {!me ? (
                <div className="flex flex-col gap-4">
                  <p className="rounded-[14px] bg-surface-50 px-4 py-3 text-sm leading-normal">
                    გადასახდელად შედი ან შექმენი ანგარიში — შენი არჩევანი შენახული დარჩება.
                  </p>
                  <AuthForm initialMode="register" />
                </div>
              ) : (
                <>
                  <label className="flex flex-col gap-2 text-sm font-bold">
                    ტელეფონი
                    <span className="-mt-1 text-[13px] font-medium text-ink-500">ხელოსანი ამ ნომერზე დაგიკავშირდება</span>
                    <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhoneEdit(e.target.value)} placeholder="+995 5XX XX XX XX" maxLength={30} className={field} />
                  </label>
                  <div className={`flex min-h-[60px] items-center gap-3.5 rounded-[14px] border-[1.5px] px-4 ${pickCls(true)}`}>
                    <Radio on />
                    <span className="flex-1 text-[15px] font-bold">HomeCrew ბალანსი</span>
                    <span className={`text-[13px] ${enoughMoney ? 'text-ink-500' : 'font-bold text-[#B42318]'}`}>ხელმისაწვდომი: {formatPrice(me.balance)}</span>
                  </div>
                  {!enoughMoney && (
                    <p className="rounded-[14px] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B42318]">
                      ბალანსზე საკმარისი თანხა არ არის.{' '}
                      <Link to="/account?tab=payments" className="font-bold underline">
                        დაამატე სატესტო თანხა
                      </Link>
                    </p>
                  )}
                  <div className="flex items-start gap-3 rounded-[14px] bg-brand-50 px-4 py-3.5 text-sm leading-normal text-[#064E3B]">
                    <Icon path={icons.shield} strokeWidth={2} className="mt-px shrink-0 text-brand-700" />
                    <span>
                      <strong>კმაყოფილების გარანტია.</strong> არ მოგეწონა? ხელოსანს უფასოდ დავაბრუნებთ ან თანხას დაგიბრუნებთ.
                    </span>
                  </div>
                  <p className="text-[13px] text-ink-500">ნამდვილი ბარათით გადახდა ჯერ არ არის ჩართული — თანხა ჩამოიჭრება სატესტო ბალანსიდან.</p>
                  {pay.isError && (
                    <p role="alert" className="rounded-[14px] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B42318]">
                      {bookingError(pay.error)}
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {step === 5 && done && (
            <>
              <div className="flex flex-col items-center gap-3.5 py-4 text-center">
                <span className="grid size-[72px] place-items-center rounded-full bg-brand-700 text-white">
                  <Icon path={icons.check} size={36} strokeWidth={2.5} />
                </span>
                <h2 className="text-[28px] font-extrabold tracking-tight">ჯავშანი მიღებულია</h2>
                <p className="max-w-[420px] text-base leading-normal text-ink-500">
                  {pro ? pro.name : 'შერჩეული ხელოსანი'} მოვა {longDay(date)}, {slot && slotRange(slot)} შუალედში.
                </p>
                <span className="rounded-lg bg-surface-50 px-2.5 py-1.5 font-mono text-[13px]">კოდი {done.code}</span>
              </div>
              <ol className="flex flex-col border-t border-surface-200 pt-5">
                {[
                  { t: 'ჯავშანი მიღებულია', s: `${formatPrice(done.total)} დაიბლოკა ბალანსზე`, c: 'bg-brand-700' },
                  { t: 'ხელოსანი დაგიკავშირდება', s: 'ჩვეულებრივ 15 წუთში', c: 'bg-navy-900' },
                  { t: 'სამუშაო', s: 'სტატუსს ნახავ ანგარიშში → ჩემი ჯავშნები', c: 'bg-surface-300' },
                  { t: 'შეფასება', s: 'დასრულების შემდეგ შეაფასე ხელოსანი', c: 'bg-surface-300' },
                ].map((r, i, all) => (
                  <li key={r.t} className="flex gap-3.5">
                    <span className="flex flex-col items-center">
                      <span className={`mt-1 size-3 rounded-full ${r.c}`} />
                      {i < all.length - 1 && <span className="min-h-6 w-0.5 flex-1 bg-surface-200" />}
                    </span>
                    <span className="flex flex-col gap-0.5 pb-4">
                      <span className="text-[15px] font-bold">{r.t}</span>
                      <span className="text-[13px] text-ink-500">{r.s}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}

          <div className="flex flex-wrap justify-between gap-2.5 border-t border-surface-200 pt-5">
            <button type="button" onClick={back} className="min-h-[50px] rounded-xl border border-surface-300 bg-white px-5 text-[15px] font-bold">
              {step === 1 ? '← სერვისი' : step === 5 ? 'მთავარზე დაბრუნება' : '← უკან'}
            </button>
            {!(step === 4 && !me) && (
              <button
                type="button"
                onClick={next}
                disabled={cantNext}
                className="min-h-[50px] max-w-[320px] flex-[1_1_200px] rounded-xl bg-brand-700 px-6 text-[15px] font-extrabold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-mist-400"
              >
                {step === 4 ? (pay.isPending ? 'მუშავდება…' : `დადასტურება და გადახდა · ${formatPrice(total)}`) : step === 5 ? 'ჩემი ჯავშნები' : 'გაგრძელება'}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="flex max-w-[380px] min-w-0 flex-[1_1_300px] flex-col gap-4 rounded-panel border border-surface-200 bg-white p-6 lg:sticky lg:top-[88px]">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Icon path={service.icon} size={22} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-extrabold">{service.service}</span>
              <span className="text-[13px] text-ink-500">
                {pkg.name}
                {pkg.description && ` · ${pkg.description}`}
              </span>
            </span>
          </div>
          <dl className="flex flex-col gap-2.5 border-t border-surface-200 pt-4 text-sm">
            {summary.map((r) => (
              <div key={r.k} className="flex justify-between gap-3">
                <dt className="text-ink-500">{r.k}</dt>
                <dd className={`text-right font-semibold ${r.v ? '' : 'text-mist-400'}`}>{r.v ?? r.empty}</dd>
              </div>
            ))}
          </dl>
          <PriceLines price={pkg.price} big />
        </aside>
      </div>
    </div>
  )
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-[26px] font-extrabold tracking-tight">{title}</h1>
      <p className="text-[15px] text-ink-500">{sub}</p>
    </div>
  )
}
