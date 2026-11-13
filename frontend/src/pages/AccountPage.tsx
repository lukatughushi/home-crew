import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '@/components/ui/Icon'
import { ME_KEY, useMe, useSetMe } from '@/hooks/useMe'
import { relativeDay, slotRange } from '@/lib/booking'
import { formatPrice } from '@/lib/format'
import { account } from '@/services/api'
import type { BookingStatus, Me, MyBooking } from '@/types'

type Tab = 'bookings' | 'payments' | 'profile'

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'bookings', label: 'ჩემი ჯავშნები', icon: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' },
  { id: 'payments', label: 'ბალანსი და გადახდები', icon: 'M3 6h18v12H3zM3 10h18M7 15h4' },
  { id: 'profile', label: 'პარამეტრები', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6 8-6s8 2 8 6' },
]

const STATUS: Record<BookingStatus, { label: string; cls: string }> = {
  PENDING: { label: 'ხელოსანს ვარჩევთ', cls: 'bg-[#FFF7E6] text-[#92400E]' },
  CONFIRMED: { label: 'დადასტურებული', cls: 'bg-brand-50 text-brand-700' },
  ON_THE_WAY: { label: 'ხელოსანი გზაშია', cls: 'bg-[#E0F2FE] text-[#075985]' },
  IN_PROGRESS: { label: 'მიმდინარეობს', cls: 'bg-[#E0F2FE] text-[#075985]' },
  COMPLETED: { label: 'დასრულებული', cls: 'bg-brand-50 text-brand-700' },
  CANCELLED: { label: 'გაუქმებული', cls: 'bg-surface-50 text-ink-500' },
  DISPUTED: { label: 'დავა განიხილება', cls: 'bg-[#FEF2F2] text-[#B42318]' },
}

/** Progress bar on upcoming bookings, as in the design. */
const TRACK: { label: string; reached: BookingStatus[] }[] = [
  { label: 'დადასტურდა', reached: ['CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'] },
  { label: 'გზაშია', reached: ['ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED'] },
  { label: 'მიმდინარეობს', reached: ['IN_PROGRESS', 'COMPLETED'] },
  { label: 'დასრულდა', reached: ['COMPLETED'] },
]

const btnDark = 'min-h-11 rounded-[10px] bg-navy-900 px-3.5 text-sm font-bold text-white hover:bg-navy-800 disabled:opacity-50'
const btnLine = 'min-h-11 rounded-[10px] border border-surface-300 bg-white px-3.5 text-sm font-bold hover:border-navy-900 disabled:opacity-50'

export default function AccountPage() {
  const { me, loading } = useMe()
  const [params, setParams] = useSearchParams()
  const tab: Tab = NAV.some((n) => n.id === params.get('tab')) ? (params.get('tab') as Tab) : 'bookings'

  if (loading) return <p className="mx-auto max-w-[1200px] px-5 py-16 text-ink-500">იტვირთება…</p>
  if (!me) return <Navigate to="/login?next=/account" replace />

  const firstName = me.name.split(/\s+/)[0]
  const since = new Date(me.createdAt).getFullYear()

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 pt-7 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-[60px] shrink-0 place-items-center rounded-full bg-navy-900 text-xl font-extrabold text-white">{me.initials}</span>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[clamp(24px,3vw,30px)] font-extrabold tracking-tight">გამარჯობა, {firstName}</h1>
            <span className="text-sm text-ink-500">
              {me.email} · წევრი {since} წლიდან
            </span>
          </div>
        </div>
        <Link to="/#categories" className="flex min-h-12 items-center rounded-xl bg-brand-700 px-5 text-[15px] font-extrabold text-white hover:bg-brand-800">
          + ახალი ჯავშანი
        </Link>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <nav className="flex w-full gap-1 overflow-x-auto rounded-card border border-surface-200 bg-white p-2 lg:w-[260px] lg:flex-col" aria-label="ანგარიში">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-current={tab === n.id ? 'page' : undefined}
              onClick={() => setParams(n.id === 'bookings' ? {} : { tab: n.id }, { replace: true })}
              className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-[10px] px-3.5 text-left text-sm font-bold whitespace-nowrap ${
                tab === n.id ? 'bg-navy-900 text-white' : 'hover:bg-surface-50'
              }`}
            >
              <Icon path={n.icon} size={18} />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {tab === 'bookings' && <Bookings />}
          {tab === 'payments' && <Payments me={me} />}
          {tab === 'profile' && <Profile me={me} />}
        </div>
      </div>
    </div>
  )
}

// ─── Bookings ─────────────────────────────────────────────────────

function Bookings() {
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')
  const { data, isPending, isError } = useQuery({ queryKey: ['my-bookings'], queryFn: account.bookings })

  if (isPending) return <p className="text-ink-500">იტვირთება…</p>
  if (isError) return <p className="text-ink-500">ჯავშნები ვერ ჩაიტვირთა.</p>

  const upcoming = data.filter((b) => b.upcoming).reverse() // soonest first
  const past = data.filter((b) => !b.upcoming)
  const list = filter === 'upcoming' ? upcoming : past

  return (
    <>
      <div className="flex gap-1 self-start rounded-xl bg-surface-200 p-1">
        {(
          [
            ['upcoming', `მომავალი (${upcoming.length})`],
            ['past', 'წარსული'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`min-h-10 rounded-[9px] px-4 text-sm font-bold ${filter === id ? 'bg-white shadow-[0_1px_3px_rgba(11,31,58,.12)]' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-card border border-surface-200 bg-white p-6">
          <span className="text-[15px] text-ink-500">{filter === 'upcoming' ? 'მომავალი ჯავშანი არ გაქვს.' : 'წარსული ჯავშანი ჯერ არ არის.'}</span>
          <Link to="/#categories" className="font-bold text-brand-700 hover:underline">
            აირჩიე სერვისი →
          </Link>
        </div>
      ) : filter === 'upcoming' ? (
        <>
          <UpcomingHero b={list[0]} />
          {list.slice(1).map((b) => (
            <BookingRow key={b.id} b={b} />
          ))}
        </>
      ) : (
        list.map((b) => <BookingRow key={b.id} b={b} />)
      )}
    </>
  )
}

function useCancel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => account.cancelBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
      qc.invalidateQueries({ queryKey: ME_KEY })
      qc.invalidateQueries({ queryKey: ['my-transactions'] })
    },
  })
}

function CancelButton({ b }: { b: MyBooking }) {
  const cancel = useCancel()
  if (!b.canCancel) return b.cancelNote ? <span className="text-[13px] text-ink-500">{b.cancelNote}</span> : null
  return (
    <>
      <button
        type="button"
        disabled={cancel.isPending}
        onClick={() => confirm(`გავაუქმოთ ჯავშანი ${b.code}? ${formatPrice(b.total)} დაგიბრუნდება ბალანსზე.`) && cancel.mutate(b.id)}
        className="min-h-11 px-2 text-sm font-bold text-[#B42318] hover:underline disabled:opacity-50"
      >
        {cancel.isPending ? 'უქმდება…' : 'გაუქმება'}
      </button>
      {cancel.isError && <span className="text-[13px] font-semibold text-[#B42318]">ვერ გაუქმდა — განაახლე გვერდი</span>}
    </>
  )
}

function UpcomingHero({ b }: { b: MyBooking }) {
  const status = STATUS[b.status]
  return (
    <div className="overflow-hidden rounded-panel border border-surface-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-900 px-6 py-5 text-white">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-2 text-[13px] font-bold text-brand-500">
            <span className="size-2 rounded-full bg-brand-500" />
            {status.label}
          </span>
          <span className="text-xl font-extrabold">{b.service.service}</span>
          <span className="text-sm text-mist-300">
            {relativeDay(b.date)} · {slotRange(b.slot)} · {b.address}
          </span>
        </div>
        <span className="font-mono text-xs text-mist-400">{b.code}</span>
      </div>
      <div className="flex flex-col gap-5 px-6 py-5">
        <div className="grid grid-cols-4 gap-1.5">
          {TRACK.map((t) => {
            const on = t.reached.includes(b.status)
            return (
              <div key={t.label} className="flex flex-col gap-2">
                <span className={`h-1.5 rounded-full ${on ? 'bg-brand-700' : 'bg-surface-200'}`} />
                <span className={`text-xs font-bold ${on ? '' : 'text-mist-400'}`}>{t.label}</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-brand-50 font-extrabold text-brand-700">{b.pro?.initials ?? '★'}</span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold">{b.pro?.name ?? 'ხელოსანს ვარჩევთ'}</span>
              <span className="text-[13px] text-ink-500">{b.package?.name ?? ''}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CancelButton b={b} />
          </div>
        </div>
        <div className="rounded-xl bg-surface-50 px-3.5 py-3 text-[13px] leading-normal text-ink-600">
          <strong>{formatPrice(b.total)}</strong> დაბლოკილია ბალანსზე — ჩამოიჭრება სამუშაოს დასრულების შემდეგ.
        </div>
      </div>
    </div>
  )
}

function BookingRow({ b }: { b: MyBooking }) {
  const status = STATUS[b.status]
  const [rating, setRating] = useState(false)
  return (
    <div className="flex flex-col gap-3 rounded-card border border-surface-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-50">
          <Icon path={b.service.icon} size={22} />
        </span>
        <span className="flex flex-[1_1_200px] flex-col gap-0.5">
          <span className="text-[15px] font-bold">
            {b.service.name}
            {b.package && ` · ${b.package.name}`}
          </span>
          <span className="text-[13px] text-ink-500">
            {[`${relativeDay(b.date)} · ${slotRange(b.slot)}`, b.pro?.name, b.code].filter(Boolean).join(' · ')}
          </span>
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.cls}`}>{status.label}</span>
        <span className="text-[15px] font-extrabold">{formatPrice(b.total)}</span>
        {b.rating !== null && (
          <span className="text-sm tracking-[1px] text-star" aria-label={`${b.rating} ვარსკვლავი`}>
            {'★'.repeat(b.rating)}
          </span>
        )}
        {b.canReview && !rating && (
          <button type="button" onClick={() => setRating(true)} className="min-h-11 rounded-[10px] border-[1.5px] border-star bg-[#FFFBEB] px-3.5 text-sm font-bold text-[#92400E]">
            შეაფასე
          </button>
        )}
        {b.upcoming ? <CancelButton b={b} /> : (
          <Link to={`/services/${b.service.id}`} className={`${btnDark} flex items-center`}>
            ხელახლა დაჯავშნა
          </Link>
        )}
      </div>
      {b.refundedAmount > 0 && <span className="text-[13px] text-ink-500">{formatPrice(b.refundedAmount)} დაგიბრუნდა ბალანსზე</span>}
      {rating && <ReviewForm b={b} onClose={() => setRating(false)} />}
    </div>
  )
}

function ReviewForm({ b, onClose }: { b: MyBooking; onClose: () => void }) {
  const qc = useQueryClient()
  const [stars, setStars] = useState(5)
  const [quote, setQuote] = useState('')
  const save = useMutation({
    mutationFn: () => account.reviewBooking(b.id, stars, quote.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] })
      onClose()
    },
  })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 border-t border-surface-200 pt-3">
      <div className="flex gap-1" role="radiogroup" aria-label="შეფასება">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} ვარსკვლავი`} onClick={() => setStars(n)} className={`size-11 text-[26px] ${n <= stars ? 'text-star' : 'text-surface-300'}`}>
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        maxLength={1000}
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        placeholder="რამდენიმე სიტყვა ხელოსანზე (არასავალდებულო)"
        className="rounded-xl border-[1.5px] border-surface-300 px-3.5 py-2.5 text-[15px] outline-brand-700"
      />
      {save.isError && <span className="text-[13px] font-semibold text-[#B42318]">შეფასება ვერ შეინახა</span>}
      <div className="flex gap-2">
        <button type="submit" disabled={save.isPending} className={btnDark}>
          შენახვა
        </button>
        <button type="button" onClick={onClose} className={btnLine}>
          გაუქმება
        </button>
      </div>
    </form>
  )
}

// ─── Balance & payments ───────────────────────────────────────────

const TX_LABEL = { TOPUP: 'შევსება', PAYMENT: 'გადახდა', REFUND: 'დაბრუნება' } as const
const txDate = new Intl.DateTimeFormat('ka-GE', { timeZone: 'Asia/Tbilisi', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Payments({ me }: { me: Me }) {
  const setMe = useSetMe()
  const qc = useQueryClient()
  const { data, isPending } = useQuery({ queryKey: ['my-transactions'], queryFn: account.transactions })
  const topUp = useMutation({
    mutationFn: account.topUp,
    onSuccess: (fresh) => {
      setMe(fresh)
      qc.invalidateQueries({ queryKey: ['my-transactions'] })
    },
  })

  return (
    <>
      <h2 className="text-[22px] font-extrabold">ბალანსი</h2>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-navy-900 px-6 py-5 text-white">
        <span className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-mist-300">ხელმისაწვდომი თანხა</span>
          <span className="text-[32px] font-extrabold tracking-tight">{formatPrice(me.balance)}</span>
        </span>
        {me.canTopUp && (
          <button
            type="button"
            disabled={topUp.isPending}
            onClick={() => topUp.mutate()}
            className="min-h-11 rounded-[10px] bg-brand-500 px-4 text-sm font-extrabold text-navy-900 hover:bg-brand-400 disabled:opacity-60"
          >
            + 500 ₾ სატესტო თანხა
          </button>
        )}
      </div>
      {topUp.isError && <p className="text-[13px] font-semibold text-[#B42318]">სატესტო ბალანსი მაქსიმუმ 5 000 ₾ შეიძლება იყოს.</p>}
      <p className="text-[13px] text-ink-500">
        ნამდვილი ბარათით გადახდა ჯერ არ არის ჩართული. ჯავშნის თანხა ჩამოიჭრება ამ სატესტო ბალანსიდან, გაუქმებისას კი უკან ბრუნდება.
      </p>

      <h2 className="mt-3 text-[22px] font-extrabold">ისტორია</h2>
      <div className="rounded-card border border-surface-200 bg-white">
        {isPending && <p className="px-5 py-4 text-ink-500">იტვირთება…</p>}
        {data?.length === 0 && <p className="px-5 py-4 text-ink-500">ჯერ არაფერია.</p>}
        {data?.map((t, i) => (
          <div key={t.id} className={`flex flex-wrap items-center gap-3 px-[18px] py-3.5 ${i ? 'border-t border-surface-200' : ''}`}>
            <span className="flex flex-[1_1_200px] flex-col gap-0.5">
              <span className="text-sm font-bold">{t.note || TX_LABEL[t.type]}</span>
              <span className="text-[13px] text-ink-500">{txDate.format(new Date(t.createdAt))}</span>
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${t.amount < 0 ? 'bg-[#FFFBEB] text-[#92400E]' : 'bg-brand-50 text-brand-700'}`}>
              {TX_LABEL[t.type]}
            </span>
            <span className={`min-w-20 text-right text-[15px] font-extrabold ${t.amount < 0 ? '' : 'text-brand-700'}`}>
              {t.amount > 0 ? '+' : '−'}
              {formatPrice(Math.abs(t.amount))}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Profile ──────────────────────────────────────────────────────

function Profile({ me }: { me: Me }) {
  const setMe = useSetMe()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [name, setName] = useState(me.name)
  const [phone, setPhone] = useState(me.phone)
  const save = useMutation({ mutationFn: () => account.update({ name: name.trim(), phone: phone.trim() }), onSuccess: setMe })
  const logout = useMutation({
    mutationFn: account.logout,
    onSuccess: () => {
      setMe(null)
      qc.removeQueries({ queryKey: ['my-bookings'] })
      qc.removeQueries({ queryKey: ['my-transactions'] })
      navigate('/')
    },
  })
  const field = 'min-h-12 rounded-xl border-[1.5px] border-surface-300 bg-white px-3.5 text-[15px] font-normal outline-brand-700 read-only:bg-surface-50 read-only:text-ink-500'
  const dirty = name.trim() !== me.name || phone.trim() !== me.phone

  return (
    <>
      <h2 className="text-[22px] font-extrabold">პროფილი</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 rounded-card border border-surface-200 bg-white p-5"
      >
        <label className="flex flex-col gap-2 text-sm font-bold">
          სახელი და გვარი
          <input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-bold">
          ელფოსტა
          <input readOnly value={me.email} className={field} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-bold">
          ტელეფონი
          <input type="tel" maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+995 5XX XX XX XX" className={field} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-bold">
          ენა
          <input readOnly value="ქართული" className={field} />
        </label>
        <div className="col-span-full flex items-center justify-end gap-3">
          {save.isSuccess && !dirty && <span className="text-sm font-semibold text-brand-700">შენახულია ✓</span>}
          {save.isError && <span className="text-sm font-semibold text-[#B42318]">ვერ შეინახა</span>}
          <button type="submit" disabled={!dirty || save.isPending} className="min-h-12 rounded-xl bg-brand-700 px-5 text-[15px] font-extrabold text-white hover:bg-brand-800 disabled:opacity-50">
            შენახვა
          </button>
        </div>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <span className="text-ink-500">შესული ხარ ელფოსტით</span>
        <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending} className="min-h-11 font-bold hover:underline">
          გასვლა
        </button>
      </div>
    </>
  )
}
