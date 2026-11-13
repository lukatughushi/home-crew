import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/admin/toastContext'
import { Card, dangerLink, Pill, secondaryBtn, StateBox } from '@/components/admin/ui'
import { formatPrice } from '@/lib/format'
import { hoursUntil, RESOLUTION, slaLabel } from '@/lib/adminFormat'
import { adminApi, errorMessage } from '@/services/adminApi'
import type { AdminDispute, DisputeResolution } from '@/types/admin'

export default function DisputesPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const { data, isPending, isError } = useQuery({
    queryKey: ['admin', 'disputes'],
    queryFn: adminApi.disputes,
    refetchInterval: 60_000, // keeps the SLA countdown fresh
  })

  const resolve = useMutation({
    mutationFn: ({ d, r }: { d: AdminDispute; r: DisputeResolution }) => adminApi.resolveDispute(d.id, r),
    onSuccess: (_, { d, r }) => {
      toast(`${d.code} — ${RESOLUTION[r]}`)
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  })

  if (isPending) return <StateBox>იტვირთება…</StateBox>
  if (isError) return <StateBox>დავები ვერ ჩაიტვირთა.</StateBox>
  if (!data.length) return <StateBox>დავა არ არის.</StateBox>

  const act = (d: AdminDispute, r: DisputeResolution, question?: string) => {
    if (question && !confirm(question)) return
    resolve.mutate({ d, r })
  }

  return (
    <>
      {data.map((d) => {
        const open = !d.resolution
        const hoursLeft = hoursUntil(d.deadline)
        const urgent = open && hoursLeft < 12
        return (
          <Card key={d.id} className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-mono text-xs text-ink-500">
                  {d.code} · <strong className="text-navy-900">{formatPrice(d.total)}</strong>
                </span>
                <span className="text-base font-extrabold">
                  {d.service}
                  {d.package ? ` · ${d.package}` : ''}
                </span>
              </span>
              {open ? (
                <Pill bg={urgent ? '#FEF2F2' : '#FFF7E6'} fg={urgent ? '#B42318' : '#92400E'}>
                  {slaLabel(d.deadline)}
                </Pill>
              ) : (
                <Pill bg="#F1F3F6" fg="#5A6A80">
                  დახურული
                </Pill>
              )}
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
              <div className="flex flex-col gap-1.5 rounded-xl bg-[#F8FAFC] p-3.5">
                <span className="text-xs font-bold text-ink-500">მომხმარებელი · {d.customerName}</span>
                <span className="text-sm leading-relaxed">{d.reason}</span>
                {d.photos > 0 && <span className="text-xs text-ink-500">{d.photos} ფოტო მიმაგრებულია</span>}
              </div>
              <div className="flex flex-col gap-1.5 rounded-xl bg-[#F8FAFC] p-3.5">
                <span className="text-xs font-bold text-ink-500">ხელოსანი · {d.pro?.name ?? '—'}</span>
                <span className="text-sm leading-relaxed">{d.proReply || 'პასუხი ჯერ არ არის.'}</span>
              </div>
            </div>

            {open ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={resolve.isPending}
                  onClick={() => act(d, 'REVISIT')}
                  className="min-h-11 rounded-[10px] bg-navy-900 px-4 text-sm font-bold text-white disabled:opacity-50"
                >
                  ხელახალი ვიზიტი (უფასო)
                </button>
                <button
                  type="button"
                  className={secondaryBtn}
                  disabled={resolve.isPending}
                  onClick={() => act(d, 'REFUND_HALF', `დავუბრუნოთ ${formatPrice(d.total / 2)} (50%)?`)}
                >
                  50% დაბრუნება
                </button>
                <button
                  type="button"
                  className={secondaryBtn}
                  disabled={resolve.isPending}
                  onClick={() => act(d, 'REFUND_FULL', `დავუბრუნოთ სრული თანხა — ${formatPrice(d.total)}?`)}
                >
                  სრული დაბრუნება
                </button>
                <button
                  type="button"
                  className={dangerLink}
                  disabled={resolve.isPending}
                  onClick={() => act(d, 'REJECTED', 'უარვყოთ საჩივარი?')}
                >
                  საჩივრის უარყოფა
                </button>
              </div>
            ) : (
              <div className="flex min-h-11 items-center rounded-[10px] bg-brand-50 px-4 text-sm font-bold text-brand-700">
                გადაწყვეტილი: {RESOLUTION[d.resolution!]}
                {d.refundedAmount > 0 && ` · ${formatPrice(d.refundedAmount)}`}
              </div>
            )}
          </Card>
        )
      })}
    </>
  )
}
