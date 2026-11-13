import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useToast } from '@/components/admin/toastContext'
import { Avatar, Card, dangerLink, primaryBtn, secondaryBtn, SegmentTabs, StateBox, Toggle } from '@/components/admin/ui'
import { agoLabel } from '@/lib/adminFormat'
import { adminApi, errorMessage } from '@/services/adminApi'
import type { AdminPro } from '@/types/admin'

type Tab = 'queue' | 'list'

export default function ProsPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'list' ? 'list' : 'queue'
  const queue = useQuery({ queryKey: ['admin', 'pros', 'PENDING'], queryFn: () => adminApi.pros('PENDING') })

  return (
    <>
      <SegmentTabs<Tab>
        tabs={[
          { id: 'queue', label: `ვერიფიკაცია (${queue.data?.length ?? '…'})` },
          { id: 'list', label: 'ყველა ხელოსანი' },
        ]}
        value={tab}
        onChange={(t) => setParams(t === 'queue' ? {} : { tab: t }, { replace: true })}
      />
      {tab === 'queue' ? <Queue pros={queue.data} isPending={queue.isPending} isError={queue.isError} /> : <ProList />}
    </>
  )
}

function useProAction() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ({ fn }: { fn: () => Promise<AdminPro>; msg: string }) => fn(),
    onSuccess: (_pro, { msg }) => {
      toast(msg)
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  })
}

function Queue({ pros, isPending, isError }: { pros?: AdminPro[]; isPending: boolean; isError: boolean }) {
  const action = useProAction()

  if (isPending) return <StateBox>იტვირთება…</StateBox>
  if (isError || !pros) return <StateBox>განაცხადები ვერ ჩაიტვირთა.</StateBox>
  if (!pros.length) return <StateBox>ახალი განაცხადი არ არის.</StateBox>

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
      {pros.map((a) => {
        const ready = a.documents.every((d) => d.isVerified)
        return (
          <Card key={a.id} className="flex flex-col gap-3.5 p-5">
            <div className="flex items-center gap-3">
              <Avatar initials={a.initials} size={48} dark />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-extrabold">{a.name}</span>
                <span className="text-[13px] text-ink-500">
                  {[a.services[0]?.name, a.district, a.experienceYears ? `${a.experienceYears} წ. გამოცდ.` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              <span className="text-xs whitespace-nowrap text-ink-500">{agoLabel(a.createdAt)}</span>
            </div>

            {/* Click a document to mark it checked / missing (not in the design — needed so approval is possible). */}
            <ul className="flex flex-col gap-1 rounded-xl bg-[#F8FAFC] px-2 py-2">
              {a.documents.length === 0 && <li className="px-1.5 py-1 text-[13px] text-ink-500">დოკუმენტები არ არის ატვირთული</li>}
              {a.documents.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    disabled={action.isPending}
                    title="დააჭირე სტატუსის შესაცვლელად"
                    onClick={() =>
                      action.mutate({
                        fn: () => adminApi.setProDocument(a.id, d.id, !d.isVerified),
                        msg: `${d.name} — ${d.isVerified ? 'მონიშნულია, როგორც აკლია' : 'შემოწმებულია'}`,
                      })
                    }
                    className="flex w-full justify-between gap-2 rounded-lg px-1.5 py-1 text-left text-[13px] hover:bg-white"
                  >
                    <span>{d.name}</span>
                    <span className={`font-bold ${d.isVerified ? 'text-brand-700' : 'text-[#B42318]'}`}>
                      {d.isVerified ? '✓ შემოწმებულია' : 'აკლია'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {a.docsRequestedAt && (
              <span className="-mt-2 text-xs text-ink-500">დოკუმენტი მოთხოვნილია {agoLabel(a.docsRequestedAt)}</span>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                className={`${primaryBtn} flex-1`}
                disabled={!ready || action.isPending}
                title={ready ? undefined : 'ჯერ ყველა დოკუმენტი უნდა შემოწმდეს'}
                onClick={() => action.mutate({ fn: () => adminApi.approvePro(a.id), msg: `${a.name} — დადასტურებულია` })}
              >
                დადასტურება
              </button>
              <button
                type="button"
                className={secondaryBtn}
                disabled={action.isPending}
                onClick={() =>
                  action.mutate({ fn: () => adminApi.requestProDocs(a.id), msg: `${a.name} — დოკუმენტის მოთხოვნა ჩაიწერა` })
                }
              >
                დოკ. მოთხოვნა
              </button>
              <button
                type="button"
                className={dangerLink}
                disabled={action.isPending}
                onClick={() => {
                  if (!confirm(`უარი ვუთხრათ ${a.name}-ს?`)) return
                  action.mutate({ fn: () => adminApi.rejectPro(a.id), msg: `${a.name} — უარყოფილია` })
                }}
              >
                უარი
              </button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

const COLS = 'grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_90px_90px_110px_130px] min-w-[860px]'

function ProList() {
  const { data: pros, isPending, isError } = useQuery({
    queryKey: ['admin', 'pros', 'APPROVED'],
    queryFn: () => adminApi.pros('APPROVED'),
  })
  const action = useProAction()

  if (isPending) return <StateBox>იტვირთება…</StateBox>
  if (isError) return <StateBox>ხელოსნები ვერ ჩაიტვირთა.</StateBox>
  if (!pros.length) return <StateBox>დადასტურებული ხელოსანი ჯერ არ არის.</StateBox>

  return (
    <Card className="overflow-x-auto">
      <div className={`grid ${COLS} gap-3 border-b border-surface-200 bg-[#F8FAFC] px-5 py-3 text-xs font-bold text-ink-500`}>
        <span>ხელოსანი</span>
        <span>კატეგორია</span>
        <span>რეიტინგი</span>
        <span>სამუშაო</span>
        <span>გაუქმება</span>
        <span>აქტიური</span>
      </div>
      {pros.map((p, i) => (
        <div
          key={p.id}
          className={`grid ${COLS} min-h-[58px] items-center gap-3 px-5 text-sm ${i ? 'border-t border-surface-200' : ''}`}
        >
          <span className={`flex items-center gap-2.5 ${p.isActive ? '' : 'opacity-55'}`}>
            <Avatar initials={p.initials} />
            <span className="font-bold">{p.name}</span>
          </span>
          <span className={`truncate text-ink-500 ${p.isActive ? '' : 'opacity-55'}`}>{p.services.map((s) => s.name).join(', ') || '—'}</span>
          <span className={`font-bold ${p.isActive ? '' : 'opacity-55'}`}>
            {p.rating === null ? <span className="font-normal text-ink-500">—</span> : <><span className="text-star">★</span> {p.rating.toFixed(2)}</>}
          </span>
          <span className={p.isActive ? '' : 'opacity-55'}>{p.jobs}</span>
          <span className={`font-bold ${p.cancelRate > 5 ? 'text-[#B42318]' : ''} ${p.isActive ? '' : 'opacity-55'}`}>{p.cancelRate}%</span>
          <Toggle
            on={p.isActive}
            label={`${p.name} — აქტიური`}
            disabled={action.isPending}
            onChange={() =>
              action.mutate({
                fn: () => adminApi.setProActive(p.id, !p.isActive),
                msg: `${p.name} — ${p.isActive ? 'შეჩერებულია' : 'გააქტიურდა'}`,
              })
            }
          />
        </div>
      ))}
    </Card>
  )
}
