// Not in the admin design — added because reviews were requested; styled like the other admin pages.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useToast } from '@/components/admin/toastContext'
import { Card, dangerLink, primaryBtn, SegmentTabs, StateBox, Toggle } from '@/components/admin/ui'
import { agoLabel } from '@/lib/adminFormat'
import { adminApi, errorMessage } from '@/services/adminApi'
import type { AdminReview } from '@/types/admin'

type Filter = 'published' | 'jobs'

export default function ReviewsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('published')
  const { data, isPending, isError } = useQuery({ queryKey: ['admin', 'reviews'], queryFn: adminApi.reviews })

  const mutate = useMutation({
    mutationFn: ({ fn }: { fn: () => Promise<unknown>; msg: string }) => fn(),
    onSuccess: (_, { msg }) => {
      toast(msg)
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  })

  if (isPending) return <StateBox>იტვირთება…</StateBox>
  if (isError) return <StateBox>შეფასებები ვერ ჩაიტვირთა.</StateBox>

  // "მთავარ გვერდზე" = published + homepage testimonials without a booking; "სამუშაოების" = ratings left after a job.
  const list = data.filter((r) => (filter === 'published' ? r.isPublished || !r.bookingId : !!r.bookingId))

  const togglePublish = (r: AdminReview) =>
    mutate.mutate({
      fn: () => adminApi.saveReview({ ...r, isPublished: !r.isPublished }),
      msg: r.isPublished ? 'მთავარი გვერდიდან მოიხსნა' : 'გამოჩნდება მთავარ გვერდზე',
    })

  return (
    <>
      <SegmentTabs<Filter>
        tabs={[
          { id: 'published', label: 'მთავარი გვერდი' },
          { id: 'jobs', label: `სამუშაოების შეფასებები (${data.filter((r) => r.bookingId).length})` },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {filter === 'published' && <NewReview onCreate={(r) => mutate.mutate({ fn: () => adminApi.createReview(r), msg: 'შეფასება დაემატა' })} busy={mutate.isPending} />}

      {list.length === 0 ? (
        <StateBox>შეფასება არ არის.</StateBox>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
          {list.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-base tracking-[2px] text-star" aria-label={`${r.rating} ვარსკვლავი`}>
                  {'★'.repeat(r.rating)}
                  <span className="text-surface-300">{'★'.repeat(5 - r.rating)}</span>
                </span>
                <label className="flex items-center gap-2 text-xs font-bold text-ink-500">
                  მთავარზე
                  <Toggle on={r.isPublished} label="მთავარ გვერდზე ჩვენება" disabled={mutate.isPending} onChange={() => togglePublish(r)} />
                </label>
              </div>
              <blockquote className="text-[15px] leading-relaxed">“{r.quote}”</blockquote>
              <div className="mt-auto flex items-end justify-between gap-3">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">{r.authorName}</span>
                  <span className="text-xs text-ink-500">
                    {[r.meta, r.booking?.code, agoLabel(r.createdAt)].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <button
                  type="button"
                  className={dangerLink}
                  disabled={mutate.isPending}
                  onClick={() => {
                    if (!confirm('წავშალოთ შეფასება?')) return
                    mutate.mutate({ fn: () => adminApi.deleteReview(r.id), msg: 'შეფასება წაიშალა' })
                  }}
                >
                  წაშლა
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

function NewReview({
  onCreate,
  busy,
}: {
  onCreate: (r: { authorName: string; meta: string; quote: string; rating: number; isPublished: boolean }) => void
  busy: boolean
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ authorName: '', meta: '', quote: '', rating: 5 })
  const field = 'min-h-11 rounded-[10px] border-[1.5px] border-surface-300 px-3 text-sm font-normal outline-brand-700'

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${primaryBtn} self-start`}>
        + შეფასების დამატება
      </button>
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onCreate({ ...form, isPublished: true })
    setForm({ authorName: '', meta: '', quote: '', rating: 5 })
    setOpen(false)
  }

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          ავტორი
          <input required maxLength={80} placeholder="მაგ. ნინო ს." value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          სერვისი · უბანი
          <input maxLength={120} placeholder="მაგ. ღრმა დასუფთავება · ვაკე" value={form.meta} onChange={(e) => setForm({ ...form, meta: e.target.value })} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold sm:col-span-2">
          ტექსტი
          <textarea required maxLength={1000} rows={3} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} className={`${field} py-2.5`} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          შეფასება
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className={field}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-3 text-sm font-bold text-ink-500">
            გაუქმება
          </button>
          <button type="submit" disabled={busy} className={primaryBtn}>
            დამატება
          </button>
        </div>
      </form>
    </Card>
  )
}
