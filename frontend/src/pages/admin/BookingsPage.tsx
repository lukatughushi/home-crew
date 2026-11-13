import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BookingDrawer from '@/components/admin/BookingDrawer'
import BookingRows from '@/components/admin/BookingRows'
import { Card, secondaryBtn } from '@/components/admin/ui'
import { adminApi } from '@/services/adminApi'
import type { BookingStatus } from '@/types/admin'

const FILTERS: { id: BookingStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'ყველა' },
  { id: 'PENDING', label: 'ელოდება' },
  { id: 'CONFIRMED', label: 'დადასტურებული' },
  { id: 'IN_PROGRESS', label: 'მიმდინარე' },
  { id: 'COMPLETED', label: 'დასრულებული' },
  { id: 'DISPUTED', label: 'დავა' },
  { id: 'CANCELLED', label: 'გაუქმებული' },
]

export default function BookingsPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as BookingStatus | null) ?? undefined
  const q = params.get('q') ?? undefined
  const page = Number(params.get('page') ?? 1)
  const [openId, setOpenId] = useState<number | null>(null)

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ['admin', 'bookings', { status, q, page }],
    queryFn: () => adminApi.bookings({ status, q, page }),
    placeholderData: keepPreviousData,
  })

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  const counts = data?.counts ?? {}
  const all = Object.values(counts).reduce((a, n) => a + (n ?? 0), 0)
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const on = (status ?? 'ALL') === f.id
          const n = f.id === 'ALL' ? all : (counts[f.id] ?? 0)
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => setParam('status', f.id === 'ALL' ? undefined : f.id)}
              className={`flex min-h-[38px] items-center gap-2 rounded-full border px-3.5 text-[13px] font-bold ${on ? 'border-navy-900 bg-navy-900 text-white' : 'border-surface-200 bg-white'}`}
            >
              {f.label}
              <span className="opacity-70">{n}</span>
            </button>
          )
        })}
      </div>

      <Card className={`overflow-hidden transition-opacity ${isFetching && !isPending ? 'opacity-70' : ''}`}>
        {isPending ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">იტვირთება…</p>
        ) : isError ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">ჯავშნები ვერ ჩაიტვირთა.</p>
        ) : data.items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-500">ამ ფილტრით ჯავშანი ვერ მოიძებნა.</p>
        ) : (
          <BookingRows items={data.items} onOpen={setOpenId} />
        )}
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button type="button" className={secondaryBtn} disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>
            ← წინა
          </button>
          <span className="text-ink-500">
            {page} / {pages}
          </span>
          <button type="button" className={secondaryBtn} disabled={page >= pages} onClick={() => setParam('page', String(page + 1))}>
            შემდეგი →
          </button>
        </div>
      )}

      {openId !== null && <BookingDrawer id={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
