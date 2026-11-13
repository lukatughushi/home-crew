import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToast } from '@/components/admin/toastContext'
import { Card, StateBox, Toggle } from '@/components/admin/ui'
import Icon from '@/components/ui/Icon'
import { adminApi, errorMessage } from '@/services/adminApi'
import type { AdminService } from '@/types/admin'

interface Row {
  id: string
  price: string
  fee: string
  active: boolean
}

const toRows = (list: AdminService[]): Row[] =>
  list.map((s) => ({ id: s.id, price: String(s.priceFrom), fee: String(s.commissionPercent), active: s.isActive }))

const COLS = 'grid-cols-[48px_minmax(0,1.6fr)_minmax(0,1.6fr)_130px_130px_100px_90px] min-w-[820px]'
const input =
  'h-10 w-full rounded-[10px] border-[1.5px] border-surface-300 px-3 text-sm font-bold outline-brand-700 aria-[invalid=true]:border-[#B42318]'

export default function ServicesPage() {
  const { data, isPending, isError } = useQuery({ queryKey: ['admin', 'services'], queryFn: adminApi.services })
  if (isPending) return <StateBox>იტვირთება…</StateBox>
  if (isError) return <StateBox>სერვისები ვერ ჩაიტვირთა.</StateBox>
  // Remount the editor when fresh data arrives so the draft resets to the saved values.
  return <Editor key={JSON.stringify(toRows(data))} services={data} />
}

function Editor({ services }: { services: AdminService[] }) {
  const qc = useQueryClient()
  const toast = useToast()
  const saved = toRows(services)
  const [rows, setRows] = useState(saved)

  const dirty = JSON.stringify(rows) !== JSON.stringify(saved)
  const invalid = (r: Row) => ({
    price: r.price === '' || Number.isNaN(Number(r.price)),
    fee: r.fee === '' || Number.isNaN(Number(r.fee)) || Number(r.fee) > 100,
  })
  const hasErrors = rows.some((r) => invalid(r).price || invalid(r).fee)

  const save = useMutation({
    mutationFn: () =>
      adminApi.saveServices(
        rows.map((r) => ({ id: r.id, priceFrom: Number(r.price), commissionPercent: Number(r.fee), isActive: r.active })),
      ),
    onSuccess: (fresh) => {
      qc.setQueryData(['admin', 'services'], fresh)
      qc.invalidateQueries({ queryKey: ['admin'] })
      toast('ფასები განახლდა')
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  })

  const set = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const numeric = (v: string) => v.replace(',', '.').replace(/[^0-9.]/g, '')

  return (
    <>
      <Card className="overflow-x-auto">
        <div className={`grid ${COLS} gap-3 border-b border-surface-200 bg-[#F8FAFC] px-5 py-3 text-xs font-bold text-ink-500`}>
          <span />
          <span>კატეგორია</span>
          <span>სერვისის სახელი</span>
          <span>საწყისი ფასი, ₾</span>
          <span>საკომისიო, %</span>
          <span>ხელოსნები</span>
          <span>აქტიური</span>
        </div>
        {services.map((s, i) => {
          const r = rows[i]
          const bad = invalid(r)
          return (
            <div key={s.id} className={`grid ${COLS} items-center gap-3 px-5 py-2.5 text-sm ${i ? 'border-t border-surface-200' : ''}`}>
              <span className="grid size-10 place-items-center rounded-[10px] bg-brand-50 text-brand-700">
                <Icon path={s.icon} />
              </span>
              <span className="font-bold">{s.name}</span>
              <span className="text-ink-500">{s.service}</span>
              <input
                value={r.price}
                inputMode="decimal"
                aria-label={`${s.name} — საწყისი ფასი`}
                aria-invalid={bad.price}
                onChange={(e) => set(i, { price: numeric(e.target.value) })}
                className={input}
              />
              <input
                value={r.fee}
                inputMode="decimal"
                aria-label={`${s.name} — საკომისიო`}
                aria-invalid={bad.fee}
                onChange={(e) => set(i, { fee: numeric(e.target.value) })}
                className={input}
              />
              <span>{s.pros}</span>
              <Toggle on={r.active} label={`${s.name} — აქტიური`} onChange={() => set(i, { active: !r.active })} />
            </div>
          )
        })}
      </Card>
      <p className="text-[13px] text-ink-500">
        ფასის ცვლილება ვრცელდება მხოლოდ ახალ ჯავშნებზე. გამორთული კატეგორია საიტზე აღარ ჩანს, მაგრამ არსებული ჯავშნები რჩება.
      </p>

      {dirty && (
        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-navy-900 py-3 pr-3 pl-5 text-white shadow-[0_12px_32px_rgba(11,31,58,.25)]">
          <span className="text-sm font-semibold">
            {hasErrors ? 'შეასწორე წითლად მონიშნული ველები' : 'შეუნახავი ცვლილებები'}
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={() => setRows(saved)}
              className="min-h-[42px] rounded-[10px] border border-navy-600 px-4 text-sm font-bold"
            >
              გაუქმება
            </button>
            <button
              type="button"
              disabled={hasErrors || save.isPending}
              onClick={() => save.mutate()}
              className="min-h-[42px] rounded-[10px] bg-brand-500 px-[18px] text-sm font-extrabold text-navy-900 disabled:opacity-50"
            >
              {save.isPending ? 'ინახება…' : 'შენახვა'}
            </button>
          </span>
        </div>
      )}
    </>
  )
}
