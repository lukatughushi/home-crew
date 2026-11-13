import { useState } from 'react'
import SectionHeading from '@/components/ui/SectionHeading'
import { testimonials } from '@/content/home'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export default function Testimonials() {
  const wide = useMediaQuery('(min-width: 768px)')
  const perView = wide ? 2 : 1
  const maxIndex = testimonials.length - perView
  const [rawIndex, setIndex] = useState(0)
  const index = Math.min(rawIndex, maxIndex)

  const prev = () => setIndex(Math.max(0, index - 1))
  const next = () => setIndex(index >= maxIndex ? 0 : index + 1)
  const step = wide ? '50% + 8px' : '100% + 16px'

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16">
      <SectionHeading
        eyebrow="შეფასებები"
        title="რას ამბობენ მომხმარებლები."
        aside={
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="წინა შეფასება"
              onClick={prev}
              className="size-12 rounded-full border border-surface-300 bg-white text-lg"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="შემდეგი შეფასება"
              onClick={next}
              className="size-12 rounded-full bg-navy-900 text-lg text-white"
            >
              →
            </button>
          </div>
        }
      />

      <div className="overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ transform: `translateX(calc(${-index} * (${step})))` }}
        >
          {testimonials.map((r, i) => (
            <figure
              key={r.name}
              aria-hidden={i < index || i >= index + perView}
              className="flex shrink-0 basis-full flex-col gap-[18px] rounded-panel border border-surface-200 bg-white p-7 md:basis-[calc(50%-8px)]"
            >
              <span className="text-base tracking-[2px] text-star">★★★★★</span>
              <blockquote className="text-lg leading-relaxed font-medium text-pretty">“{r.quote}”</blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-brand-50 text-sm font-extrabold text-brand-700">
                  {r.initials}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{r.name}</span>
                  <span className="text-[13px] text-ink-500">{r.meta}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-1.5">
        {Array.from({ length: maxIndex + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`შეფასება ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-navy-900' : 'w-2 bg-surface-300'}`}
          />
        ))}
      </div>
    </section>
  )
}
