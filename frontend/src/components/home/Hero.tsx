import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import HeroSlider from '@/components/home/HeroSlider'
import Icon from '@/components/ui/Icon'
import { icons, popular } from '@/content/home'
import { useServices } from '@/hooks/useServices'
import { formatFrom } from '@/lib/format'
import { matchServices } from '@/lib/search'
import { getSite } from '@/services/api'

export default function Hero() {
  const { services } = useServices()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const heroSlides = useQuery({ queryKey: ['site'], queryFn: getSite }).data?.heroSlides ?? []

  const suggestions = matchServices(services, query)
  const open = (id: string) => navigate(`/services/${id}`)
  const search = () => {
    const best = suggestions[0] ?? services[0]
    if (best) open(best.id)
  }

  return (
    <section className="bg-navy-900 text-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-12 px-5 pt-14 pb-16">
        <div className="flex max-w-[640px] min-w-0 flex-[1_1_460px] flex-col items-start gap-[22px]">
          <span className="inline-flex items-center gap-2 rounded-full bg-navy-800 px-3 py-1.5 text-[13px] font-semibold text-mist-300">
            <span className="size-2 rounded-full bg-brand-500" />
            დღესვე თავისუფალი დრო შენს უბანში
          </span>
          <h1 className="text-[clamp(34px,5vw,56px)] leading-[1.05] font-extrabold tracking-[-.03em] text-balance">
            სანდო ხელოსნები შენი სახლის ყველა კუთხისთვის.
          </h1>
          <p className="max-w-[520px] text-lg leading-relaxed text-pretty text-mist-300">
            დასუფთავება, მებაღეობა, ელექტროობა, რემონტი და სხვა — შემოწმებული, დაზღვეული, წინასწარ ცნობილი ფასით.
          </p>

          {/* Search */}
          <div className="relative w-full max-w-[600px]">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                search()
              }}
              className="flex flex-wrap gap-2 rounded-card bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,.25)]"
            >
              <label className="flex min-h-[52px] flex-[1_1_240px] items-center gap-2.5 px-3 text-brand-700">
                <Icon path={icons.search} strokeWidth={2} />
                <input
                  id="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="რა სერვისი გჭირდება დღეს?"
                  aria-label="რა სერვისი გჭირდება დღეს?"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-base text-navy-900 outline-none"
                />
              </label>
              <label className="flex min-h-[52px] flex-[0_1_150px] items-center gap-2 border-l border-surface-200 px-3 text-ink-500">
                <Icon path={icons.pin} size={18} strokeWidth={2} />
                <input
                  placeholder="უბანი"
                  aria-label="უბანი"
                  className="w-full bg-transparent text-[15px] text-navy-900 outline-none"
                />
              </label>
              <button
                type="submit"
                className="min-h-[52px] flex-[1_0_auto] rounded-xl bg-brand-700 px-6 text-base font-bold hover:bg-brand-800"
              >
                ძებნა
              </button>
            </form>

            {focused && (
              <div className="absolute inset-x-0 top-[calc(100%+8px)] z-10 rounded-[14px] bg-white p-2 text-navy-900 shadow-[0_16px_40px_rgba(11,31,58,.25)]">
                <div className="px-3 py-2 text-xs font-bold tracking-[.06em] text-ink-500 uppercase">სერვისები</div>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    // mousedown fires before the input's blur closes the list
                    onMouseDown={() => open(s.id)}
                    className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left hover:bg-surface-50"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-brand-50 text-brand-700">
                      <Icon path={s.icon} size={18} />
                    </span>
                    <span className="flex-1 text-[15px] font-semibold">{s.service}</span>
                    <span className="text-[13px] text-ink-500">{formatFrom(s.priceFrom)}</span>
                  </button>
                ))}
                {query.trim() && suggestions.length === 0 && (
                  <div className="p-3 text-sm text-ink-500">
                    ზუსტი დამთხვევა ვერ მოიძებნა — დააჭირე ძებნას და შემოგთავაზებთ უახლოეს ხელოსნებს.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-mist-400">პოპულარული:</span>
            {popular.map((p) => (
              <Link
                key={p.label}
                to={`/services/${p.id}`}
                className="rounded-full border border-navy-600 px-3.5 py-2 text-[13px] font-semibold hover:border-brand-500"
              >
                {p.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/services/cleaning"
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3.5 text-[15px] font-extrabold text-navy-900 hover:bg-brand-400"
            >
              სწრაფი ჯავშანი 60 წამში <span aria-hidden="true">→</span>
            </Link>
            <span className="text-sm text-mist-300">
              <span className="text-star-light">★★★★★</span> 4.8 · 38 000 შეფასება
            </span>
          </div>
        </div>

        {/* Photo slider: wide (4:3) under the text on phones/tablets, tall (4:5) beside it on desktop.
            The empty placeholder and the floating cards stay desktop-only, as in the design. */}
        <div className={`relative w-full lg:max-w-[460px] lg:flex-[1_1_360px] ${heroSlides.length ? '' : 'hidden lg:block'}`}>
          {heroSlides.length ? (
            <HeroSlider slides={heroSlides} className="aspect-[4/3] w-full rounded-3xl bg-navy-800 lg:aspect-[4/5]" />
          ) : (
            // Placeholder until a photo is uploaded in admin → სურათები
            <div className="grid aspect-[4/5] place-items-center rounded-3xl bg-[repeating-linear-gradient(135deg,#1A3358_0_12px,#152C50_12px_24px)] font-mono text-xs text-mist-400">
              ფოტო: ხელოსანი სახლში მუშაობს
            </div>
          )}
          <div className="absolute bottom-10 -left-7 hidden items-center lg:flex gap-3 rounded-card bg-white px-4 py-3.5 text-navy-900 shadow-[0_16px_40px_rgba(0,0,0,.3)]">
            <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-sm font-extrabold text-brand-700">
              მბ
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-bold">მარიამი გზაშია</span>
              <span className="text-[13px] text-ink-500">ღრმა დასუფთავება · მოვა 10:30-ზე</span>
            </span>
          </div>
          <div className="absolute top-8 -right-4 hidden items-center lg:flex gap-2 rounded-[14px] bg-white px-3.5 py-2.5 text-[13px] font-bold text-navy-900 shadow-[0_16px_40px_rgba(0,0,0,.3)]">
            <Icon path={icons.shield} size={18} strokeWidth={2} className="text-brand-700" />
            პირადობა და დაზღვევა დადასტურებულია
          </div>
        </div>
      </div>
    </section>
  )
}
