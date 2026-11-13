import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/format'
import { momentLabel, PAYMENT, STATUS, visitLabel } from '@/lib/adminFormat'
import { initials } from '@/lib/text'
import { adminApi, errorMessage } from '@/services/adminApi'
import type { BookingStatus } from '@/types/admin'
import { useToast } from './toastContext'
import { Avatar, dangerLink, primaryBtn, secondaryBtn, StatusPill } from './ui'

// Statuses an admin can set by hand. Cancelling / refunding / disputes have their own actions.
const MANUAL: BookingStatus[] = ['PENDING', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED']

export default function BookingDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const { data: b, isPending, isError } = useQuery({ queryKey: ['admin', 'booking', id], queryFn: () => adminApi.booking(id) })
  const [assignTo, setAssignTo] = useState<number | ''>('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] })
  const run = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: refresh,
    onError: (err) => toast(errorMessage(err), 'error'),
  })
  const act = (fn: () => Promise<unknown>, msg: string, after?: () => void) =>
    run.mutate(fn, {
      onSuccess: () => {
        toast(msg)
        after?.()
      },
    })

  const firstPro = b?.eligiblePros[0]?.id ?? ''
  const selected = assignTo === '' ? firstPro : assignTo
  const closed = b?.status === 'CANCELLED'

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-[rgba(11,31,58,.35)]" aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={b ? `ჯავშანი ${b.code}` : 'ჯავშანი'}
        className="fixed inset-y-0 right-0 z-[41] flex w-[min(460px,100%)] flex-col bg-white shadow-[-16px_0_48px_rgba(11,31,58,.2)]"
      >
        <div className="flex items-center gap-3 border-b border-surface-200 px-[22px] py-[18px]">
          <span className="flex flex-1 flex-col gap-1">
            <span className="font-mono text-xs text-ink-500">{b?.code ?? '…'}</span>
            <span className="text-lg font-extrabold">
              {b ? `${b.service.name}${b.package ? ` · ${b.package.name}` : ''}` : ''}
            </span>
          </span>
          {b && <StatusPill status={b.status} />}
          <button
            type="button"
            aria-label="დახურვა"
            onClick={onClose}
            className="size-10 rounded-[10px] border border-surface-200 text-lg"
          >
            ×
          </button>
        </div>

        {isPending ? (
          <p className="p-6 text-sm text-ink-500">იტვირთება…</p>
        ) : isError || !b ? (
          <p className="p-6 text-sm text-ink-500">ჯავშანი ვერ ჩაიტვირთა.</p>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-[22px]">
              <dl className="grid grid-cols-2 gap-3.5">
                {[
                  ['მომხმარებელი', b.customerName],
                  ['ტელეფონი', b.customerPhone],
                  ['დრო', `${visitLabel(b.date, b.slot)} (${b.slot})`],
                  ['უბანი', b.district || '—'],
                  ['თანხა', formatPrice(b.total)],
                  ['გადახდა', PAYMENT[b.paymentState] + (b.refundedAmount ? ` · ${formatPrice(b.refundedAmount)}` : '')],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1">
                    <dt className="text-xs font-bold text-ink-500">{k}</dt>
                    <dd className="text-sm font-semibold">{v}</dd>
                  </div>
                ))}
                <div className="col-span-2 flex flex-col gap-1">
                  <dt className="text-xs font-bold text-ink-500">მისამართი</dt>
                  <dd className="text-sm font-semibold">{b.address}</dd>
                </div>
                {b.notes && (
                  <div className="col-span-2 flex flex-col gap-1">
                    <dt className="text-xs font-bold text-ink-500">შენიშვნა</dt>
                    <dd className="text-sm">{b.notes}</dd>
                  </div>
                )}
              </dl>

              <section className="flex flex-col gap-3 rounded-[14px] bg-[#F8FAFC] p-4">
                <span className="text-sm font-extrabold">ხელოსანი</span>
                {b.pro ? (
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={initials(b.pro.name)} size={40} dark />
                    <span className="flex-1 text-[15px] font-bold">{b.pro.name}</span>
                    {!closed && b.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        disabled={run.isPending}
                        onClick={() => act(() => adminApi.updateBooking(id, { proId: null }), `${b.code} — ხელოსანი მოიხსნა`)}
                        className="text-[13px] font-bold text-brand-700 hover:underline"
                      >
                        შეცვლა
                      </button>
                    )}
                  </div>
                ) : closed ? (
                  <span className="text-[13px] text-ink-500">არ იყო მინიჭებული.</span>
                ) : (
                  <>
                    <span className="text-[13px] font-semibold text-[#92400E]">ჯერ არ არის მინიჭებული.</span>
                    {b.eligiblePros.length ? (
                      <div className="flex gap-2">
                        <select
                          value={selected}
                          onChange={(e) => setAssignTo(Number(e.target.value))}
                          aria-label="ხელოსნის არჩევა"
                          className="h-11 min-w-0 flex-1 rounded-[10px] border-[1.5px] border-surface-300 bg-white px-2.5 text-sm"
                        >
                          {b.eligiblePros.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                              {p.rating !== null ? ` · ★ ${p.rating}` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className={primaryBtn}
                          disabled={run.isPending || selected === ''}
                          onClick={() => {
                            const pro = b.eligiblePros.find((p) => p.id === selected)
                            act(() => adminApi.updateBooking(id, { proId: Number(selected) }), `${b.code} მიენიჭა: ${pro?.name}`)
                          }}
                        >
                          მინიჭება
                        </button>
                      </div>
                    ) : (
                      <span className="text-[13px] text-ink-500">ამ სერვისზე აქტიური ხელოსანი არ არის.</span>
                    )}
                  </>
                )}
              </section>

              {!closed && b.status !== 'DISPUTED' && (
                <label className="flex flex-col gap-2 text-sm font-extrabold">
                  სტატუსი
                  <select
                    value={b.status}
                    disabled={run.isPending}
                    onChange={(e) => {
                      const status = e.target.value as BookingStatus
                      act(() => adminApi.updateBooking(id, { status }), `${b.code} — ${STATUS[status][0]}`)
                    }}
                    className="h-11 rounded-[10px] border-[1.5px] border-surface-300 bg-white px-2.5 text-sm font-semibold"
                  >
                    {MANUAL.map((s) => (
                      <option key={s} value={s}>
                        {STATUS[s][0]}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <section className="flex flex-col">
                <span className="mb-3 text-sm font-extrabold">ისტორია</span>
                {b.events.map((e) => (
                  <div key={e.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-[5px] size-2.5 rounded-full bg-brand-700" />
                      <span className="min-h-5 w-0.5 flex-1 bg-surface-200" />
                    </div>
                    <div className="flex flex-col gap-0.5 pb-3.5">
                      <span className="text-sm font-semibold">{e.message}</span>
                      <span className="text-xs text-ink-500">{momentLabel(e.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </section>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-surface-200 px-[22px] py-4">
              <a href={`sms:${b.customerPhone.replace(/\s/g, '')}`} className={`${secondaryBtn} flex flex-[1_1_140px] items-center justify-center`}>
                მიწერა მომხმარებელს
              </a>
              <button
                type="button"
                className={`${secondaryBtn} flex-[1_1_120px]`}
                disabled={run.isPending || b.paymentState === 'REFUNDED'}
                onClick={() => {
                  if (!confirm(`დავუბრუნოთ ${formatPrice(b.total)} მომხმარებელს? ჯავშანი გაუქმდება.`)) return
                  act(() => adminApi.refundBooking(id), `${b.code} — თანხა დაბრუნდა`)
                }}
              >
                თანხის დაბრუნება
              </button>
              {!closed && b.status !== 'COMPLETED' && (
                <button
                  type="button"
                  className={dangerLink}
                  disabled={run.isPending}
                  onClick={() => {
                    if (!confirm(`გავაუქმოთ ჯავშანი ${b.code}?`)) return
                    act(() => adminApi.cancelBooking(id), `${b.code} გაუქმდა`, onClose)
                  }}
                >
                  გაუქმება
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  )
}
