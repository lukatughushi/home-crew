// Not in the admin design — added so the homepage photo and service photos can be changed without code.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { useToast } from '@/components/admin/toastContext'
import { Card, dangerLink, primaryBtn, secondaryBtn, StateBox } from '@/components/admin/ui'
import Icon from '@/components/ui/Icon'
import { adminApi, errorMessage, MAX_IMAGE_MB, IMAGE_ACCEPT } from '@/services/adminApi'
import type { MediaState } from '@/types/admin'

const KEY = ['admin', 'media']

export default function MediaPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const { data, isPending, isError } = useQuery({ queryKey: KEY, queryFn: adminApi.media })

  const mutate = useMutation({
    mutationFn: ({ fn }: { fn: () => Promise<MediaState>; msg: string }) => fn(),
    onSuccess: (fresh, { msg }) => {
      qc.setQueryData(KEY, fresh)
      qc.invalidateQueries({ queryKey: ['site'] })
      toast(msg)
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  })

  if (isPending) return <StateBox>იტვირთება…</StateBox>
  if (isError) return <StateBox>სურათები ვერ ჩაიტვირთა.</StateBox>

  return (
    <>
      <HeroSlides data={data} busy={mutate.isPending} run={(fn, msg) => mutate.mutate({ fn, msg })} />

      <h2 className="mt-2 text-base font-extrabold">სერვისების ფოტოები</h2>
      <p className="-mt-2 text-[13px] text-ink-500">ჩანს სერვისის გვერდის თავში. საუკეთესოა ჰორიზონტალური ფოტო, დაახლოებით 16:9.</p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {data.services.map((s) => (
          <Card key={s.id} className="flex flex-col gap-3 p-4">
            <Preview url={s.photoUrl} alt={s.photo || s.name} className="aspect-video w-full" />
            <span className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-brand-50 text-brand-700">
                <Icon path={s.icon} size={16} />
              </span>
              <span className="text-sm font-bold">{s.name}</span>
              {!s.isActive && <span className="text-xs text-ink-500">· გამორთულია</span>}
            </span>
            <ImageActions
              hasImage={!!s.photoUrl}
              busy={mutate.isPending}
              onPick={(file) =>
                mutate.mutate({ fn: () => adminApi.uploadServicePhoto(s.id, file), msg: `${s.name} — ფოტო განახლდა` })
              }
              onRemove={() =>
                mutate.mutate({ fn: () => adminApi.removeServicePhoto(s.id), msg: `${s.name} — ფოტო წაიშალა` })
              }
            />
          </Card>
        ))}
      </div>
      <p className="text-[13px] text-ink-500">
        ფორმატი: JPG, PNG ან WebP, მაქსიმუმ {MAX_IMAGE_MB} MB. ახალი ფოტო ძველს ცვლის.
      </p>
    </>
  )
}

function HeroSlides({
  data,
  busy,
  run,
}: {
  data: MediaState
  busy: boolean
  run: (fn: () => Promise<MediaState>, msg: string) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const slides = data.heroSlides
  const room = data.maxHeroSlides - slides.length

  const move = (from: number, to: number) => {
    const ids = slides.map((s) => s.id)
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    run(() => adminApi.reorderHeroSlides(ids), 'რიგი შეიცვალა')
  }

  const addFiles = (picked: File[]) => {
    const valid = picked.filter((f) => checkImage(f, toast))
    if (!valid.length) return
    const files = valid.slice(0, room)
    if (valid.length > room) toast(`მაქსიმუმ ${data.maxHeroSlides} ფოტო — დაემატება მხოლოდ ${room}`, 'error')
    // One request per file, in the order picked; the last response holds the full list.
    run(async () => {
      let state = data
      for (const f of files) state = await adminApi.addHeroSlide(f)
      return state
    }, files.length > 1 ? `${files.length} ფოტო დაემატა` : 'ფოტო დაემატა')
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="flex max-w-[620px] flex-col gap-1">
          <span className="text-base font-extrabold">მთავარი გვერდის სლაიდერი</span>
          <span className="text-[13px] leading-relaxed text-ink-500">
            ფოტოები ერთმანეთს ცვლის ყოველ 5 წამში, ამ რიგით. ჩანს სათაურის მარჯვნივ (კომპიუტერზე). საუკეთესოა ვერტიკალური ფოტო,
            დაახლოებით 4:5, მაგ. 1200×1500.
          </span>
        </span>
        <input
          ref={input}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            const files = [...(e.target.files ?? [])]
            e.target.value = '' // allow picking the same files again
            addFiles(files)
          }}
        />
        <button type="button" className={primaryBtn} disabled={busy || room <= 0} onClick={() => input.current?.click()}>
          {busy ? 'იტვირთება…' : '+ ფოტოების დამატება'}
        </button>
      </div>

      {slides.length === 0 ? (
        <p className="rounded-xl bg-[#F8FAFC] px-4 py-6 text-center text-sm text-ink-500">
          სლაიდერში ფოტო ჯერ არ არის — საიტზე ჩანს ზოლიანი ადგილი. შეგიძლია რამდენიმე ფოტო ერთად აირჩიო.
        </p>
      ) : (
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {slides.map((s, i) => (
            <li key={s.id} className="flex flex-col gap-2">
              <span className="relative">
                <Preview url={s.url} alt={`სლაიდი ${i + 1}`} className="aspect-[4/5] w-full" />
                <span className="absolute top-2 left-2 grid size-6 place-items-center rounded-full bg-navy-900/80 text-xs font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <span className="flex items-center justify-between">
                <span className="flex">
                  <button type="button" className={arrowBtn} disabled={busy || i === 0} onClick={() => move(i, i - 1)} aria-label={`სლაიდი ${i + 1} — მარცხნივ`}>
                    ←
                  </button>
                  <button
                    type="button"
                    className={arrowBtn}
                    disabled={busy || i === slides.length - 1}
                    onClick={() => move(i, i + 1)}
                    aria-label={`სლაიდი ${i + 1} — მარჯვნივ`}
                  >
                    →
                  </button>
                </span>
                <button
                  type="button"
                  className={dangerLink}
                  disabled={busy}
                  onClick={() => confirm(`წავშალოთ სლაიდი ${i + 1}?`) && run(() => adminApi.removeHeroSlide(s.id), 'სლაიდი წაიშალა')}
                >
                  წაშლა
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
      <span className="text-xs text-ink-500">
        {slides.length} / {data.maxHeroSlides} ფოტო
      </span>
    </Card>
  )
}

const arrowBtn =
  'grid size-11 place-items-center rounded-[10px] text-base font-bold text-ink-600 hover:bg-surface-50 disabled:opacity-30'

/** Client-side check so the admin gets a Georgian message before uploading. */
function checkImage(file: File, toast: ReturnType<typeof useToast>) {
  if (!IMAGE_ACCEPT.split(',').includes(file.type)) {
    toast(`${file.name} — მხოლოდ JPG, PNG ან WebP`, 'error')
    return false
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    toast(`${file.name} — ${MAX_IMAGE_MB} MB-ზე დიდია`, 'error')
    return false
  }
  return true
}

function Preview({ url, alt, className }: { url: string; alt: string; className: string }) {
  return url ? (
    <img src={url} alt={alt} className={`${className} rounded-xl bg-surface-200 object-cover`} />
  ) : (
    <span
      className={`${className} grid place-items-center rounded-xl bg-[repeating-linear-gradient(135deg,#F1F3F6_0_10px,#E6EAF0_10px_20px)] text-xs text-ink-500`}
    >
      ფოტო არ არის
    </span>
  )
}

function ImageActions({
  hasImage,
  busy,
  onPick,
  onRemove,
}: {
  hasImage: boolean
  busy: boolean
  onPick: (file: File) => void
  onRemove: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const toast = useToast()

  return (
    <span className="mt-auto flex items-center gap-2">
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = '' // allow picking the same file again
          if (file && checkImage(file, toast)) onPick(file)
        }}
      />
      <button type="button" className={secondaryBtn} disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'იტვირთება…' : hasImage ? 'შეცვლა' : 'ატვირთვა'}
      </button>
      {hasImage && (
        <button
          type="button"
          className={dangerLink}
          disabled={busy}
          onClick={() => confirm('წავშალოთ ფოტო?') && onRemove()}
        >
          წაშლა
        </button>
      )}
    </span>
  )
}
