import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/admin/toastContext'
import { Card, KpiCard, primaryBtn, StateBox } from '@/components/admin/ui'
import { formatPrice } from '@/lib/format'
import { periodLabel } from '@/lib/adminFormat'
import { adminApi, errorMessage } from '@/services/adminApi'

const COLS = 'grid-cols-[minmax(0,1.6fr)_90px_120px_120px_120px_150px] min-w-[720px]'

export default function PaymentsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const { data, isPending, isError } = useQuery({ queryKey: ['admin', 'payouts'], queryFn: adminApi.payouts })

  const pay = useMutation({
    mutationFn: (proId: number | 'all'): Promise<unknown> =>
      proId === 'all' ? adminApi.payAll() : adminApi.payPro(proId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
    onError: (err) => toast(errorMessage(err), 'error'),
  })

  if (isPending) return <StateBox>იტვირთება…</StateBox>
  if (isError) return <StateBox>გადახდები ვერ ჩაიტვირთა.</StateBox>

  const unpaid = data.rows.filter((r) => !r.paidAt)

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <KpiCard label="დაბლოკილი თანხა" value={formatPrice(Math.round(data.heldAmount))} note={`${data.heldBookings} აქტიური ჯავშანი`} />
        <KpiCard label="გადასარიცხი" value={formatPrice(Math.round(data.toPay))} note={`${data.toPayPros} ხელოსანი`} />
        <KpiCard
          label="საკომისიო · კვირა"
          value={formatPrice(Math.round(data.commissionWeek))}
          note={data.avgCommissionPercent === null ? 'ამ კვირაში დასრულებული სამუშაო არ არის' : `საშუალოდ ${data.avgCommissionPercent}%`}
        />
      </div>

      <Card className="overflow-x-auto">
        <div className="flex min-w-[720px] flex-wrap items-center justify-between gap-3 border-b border-surface-200 px-5 py-4">
          <span className="text-base font-extrabold">
            ხელოსნების გადარიცხვები
            {data.periodStart && data.periodEnd && ` · ${periodLabel(data.periodStart, data.periodEnd)}`}
          </span>
          <button
            type="button"
            className={primaryBtn}
            disabled={!unpaid.length || pay.isPending}
            onClick={() => {
              if (!confirm(`მოვნიშნოთ ${unpaid.length} ხელოსნის გადარიცხვა (${formatPrice(data.toPay)}) გადახდილად?`)) return
              pay.mutate('all', { onSuccess: () => toast('ყველა გადარიცხვა მოინიშნა გადახდილად') })
            }}
          >
            ყველას გადარიცხვა
          </button>
        </div>
        {data.rows.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-500">გადასარიცხი არაფერია.</p>}
        {data.rows.map((p, i) => (
          <div
            key={`${p.proId}-${p.paidAt ?? 'pending'}`}
            className={`grid ${COLS} min-h-[58px] items-center gap-3 px-5 text-sm ${i ? 'border-t border-surface-200' : ''}`}
          >
            <span className="font-bold">{p.proName}</span>
            <span className="text-ink-500">{p.jobs} სამუშაო</span>
            <span>{formatPrice(p.gross)}</span>
            <span className="text-ink-500">−{formatPrice(p.commission)}</span>
            <span className="font-extrabold">{formatPrice(p.net)}</span>
            {p.paidAt ? (
              <span className="justify-self-start rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                გადარიცხულია ✓
              </span>
            ) : (
              <button
                type="button"
                disabled={pay.isPending}
                onClick={() =>
                  pay.mutate(p.proId, { onSuccess: () => toast(`${p.proName}-ს გადაერიცხა ${formatPrice(p.net)}`) })
                }
                className="min-h-[38px] rounded-[10px] border border-brand-700 bg-white text-[13px] font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
              >
                გადარიცხვა
              </button>
            )}
          </div>
        ))}
      </Card>
      <p className="text-[13px] text-ink-500">
        ბანკთან ინტეგრაცია ჯერ არ არის — „გადარიცხვა" მხოლოდ აღნიშნავს, რომ თანხა გადაირიცხა.
      </p>
    </>
  )
}
