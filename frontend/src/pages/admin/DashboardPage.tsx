import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import BookingDrawer from '@/components/admin/BookingDrawer'
import BookingRows from '@/components/admin/BookingRows'
import { Card, KpiCard, StateBox } from '@/components/admin/ui'
import { formatCount, formatPrice } from '@/lib/format'
import { changeLabel, monthName, slaLabel } from '@/lib/adminFormat'
import { adminApi } from '@/services/adminApi'

const GREEN = '#047857'
const RED = '#B42318'

export default function DashboardPage() {
  const { data: s, isPending, isError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.stats,
    refetchInterval: 60_000,
  })
  const [openId, setOpenId] = useState<number | null>(null)

  if (isPending) return <StateBox>იტვირთება…</StateBox>
  if (isError) return <StateBox>მონაცემები ვერ ჩაიტვირთა.</StateBox>

  const bookings = changeLabel(s.bookingsChange, 'გუშინდელთან')
  const revenue = changeLabel(s.revenueChange, 'გუშინდელთან')
  const max = Math.max(1, ...s.chart.map((c) => c.count))
  const chartTotal = s.chart.reduce((a, c) => a + c.count, 0)
  const rc = s.ratingChange30d

  const attention = [
    {
      n: s.attention.pendingBookings,
      t: 'ჯავშანი ხელოსნის გარეშე',
      s: 'ელოდება ხელოსნის მინიჭებას',
      to: '/admin/bookings?status=PENDING',
      c: '#92400E',
      bg: '#FFFBEB',
      bd: '#FDE68A',
    },
    {
      n: s.attention.pendingPros,
      t: 'ახალი ხელოსნის განაცხადი',
      s: 'ელოდება ვერიფიკაციას',
      to: '/admin/pros',
      c: GREEN,
      bg: '#F0FAF5',
      bd: '#BBE5D0',
    },
    {
      n: s.attention.openDisputes,
      t: 'ღია დავა',
      s: s.attention.nextDisputeDeadline ? `უახლოესი ვადა: ${slaLabel(s.attention.nextDisputeDeadline)}` : 'ღია დავა არ არის',
      to: '/admin/disputes',
      c: RED,
      bg: '#FEF2F2',
      bd: '#FECACA',
    },
  ]

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <KpiCard label="ჯავშნები დღეს" value={formatCount(s.bookingsToday)} note={bookings.text} noteColor={bookings.up === false ? RED : GREEN} />
        <KpiCard label="შემოსავალი დღეს" value={formatPrice(Math.round(s.revenueToday))} note={revenue.text} noteColor={revenue.up === false ? RED : GREEN} />
        <KpiCard label="აქტიური ხელოსნები" value={formatCount(s.activePros)} note={`${s.prosOnJob} ახლა სამუშაოზე`} />
        <KpiCard
          label="საშუალო შეფასება"
          value={s.avgRating?.toFixed(2) ?? '—'}
          note={rc === null ? 'ჯერ შეფასება არ არის' : `${rc >= 0 ? '▲' : '▼'} ${Math.abs(rc).toFixed(2)} ბოლო 30 დღეში`}
          noteColor={rc !== null && rc < 0 ? RED : rc === null ? '#5A6A80' : GREEN}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {attention.map((a) => (
          <Link
            key={a.t}
            to={a.to}
            className="flex items-center gap-3.5 rounded-[14px] border px-4 py-3.5 hover:shadow-sm"
            style={{ background: a.bg, borderColor: a.bd }}
          >
            <span className="min-w-8 text-[26px] font-extrabold" style={{ color: a.c }}>
              {a.n}
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-bold">{a.t}</span>
              <span className="text-xs text-ink-500">{a.s}</span>
            </span>
            <span className="font-extrabold" style={{ color: a.c }}>
              →
            </span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Card className="flex min-w-0 flex-[2_1_480px] flex-col gap-4 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="text-base font-extrabold">ჯავშნები · ბოლო 14 დღე</span>
            <span className="text-[13px] text-ink-500">
              სულ {formatCount(chartTotal)} · საშ. {Math.round(chartTotal / s.chart.length)}/დღე
            </span>
          </div>
          <div className="flex h-[200px] items-end gap-1.5 border-b border-surface-200">
            {s.chart.map((c, i) => {
              const last = i === s.chart.length - 1
              return (
                <div key={c.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${c.count} ჯავშანი`}>
                  <span className="text-[11px] font-bold" style={{ color: last ? GREEN : '#9AA8BA' }}>
                    {c.count}
                  </span>
                  <div
                    className="w-full max-w-7 rounded-[6px_6px_2px_2px]"
                    style={{ height: `${Math.round((c.count / max) * 82)}%`, background: last ? GREEN : '#C7D2E0' }}
                  />
                </div>
              )
            })}
          </div>
          <div className="-mt-2 flex gap-1.5">
            {s.chart.map((c) => (
              <span key={c.date} className="flex-1 text-center text-[11px] text-ink-500">
                {Number(c.date.slice(8))}
              </span>
            ))}
          </div>
        </Card>

        <Card className="flex flex-[1_1_280px] flex-col gap-3.5 p-5">
          <span className="text-base font-extrabold">კატეგორიები · {monthName(s.today)}</span>
          {s.categorySplit.length === 0 && <span className="text-sm text-ink-500">ამ თვეში ჯავშანი ჯერ არ არის.</span>}
          {s.categorySplit.map((c, i) => (
            <div key={c.serviceId} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[13px]">
                <span className="font-semibold">{c.name}</span>
                <span className="font-bold">{c.percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#F0F3F7]">
                <div className="h-full rounded-full" style={{ width: `${c.percent}%`, background: i ? '#0B1F3A' : GREEN }} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4">
          <span className="text-base font-extrabold">ბოლო ჯავშნები</span>
          <Link to="/admin/bookings" className="text-sm font-bold text-brand-700 hover:underline">
            ყველა →
          </Link>
        </div>
        {s.latestBookings.length ? (
          <BookingRows items={s.latestBookings} onOpen={setOpenId} compact />
        ) : (
          <p className="px-5 py-8 text-center text-sm text-ink-500">ჯავშანი ჯერ არ არის.</p>
        )}
      </Card>

      {openId !== null && <BookingDrawer id={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
