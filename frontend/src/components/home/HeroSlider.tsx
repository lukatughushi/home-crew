import { useEffect, useState } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const INTERVAL_MS = 5000

/**
 * Homepage photo slider (photos come from admin → სურათები).
 * Crossfades every 5 s; pauses while hovered or focused, and doesn't auto-play for reduced-motion users.
 */
export default function HeroSlider({ slides, className = '' }: { slides: string[]; className?: string }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const count = slides.length
  const current = count ? index % count : 0 // stays valid if the list shrinks

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS)
    return () => clearInterval(timer)
  }, [count, paused, reducedMotion])

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="ფოტოები"
    >
      {slides.map((url, i) => (
        <img
          key={url}
          src={url}
          alt={i === current ? 'ხელოსანი სახლში მუშაობს' : ''}
          aria-hidden={i !== current}
          loading={i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
          {slides.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`ფოტო ${i + 1} / ${count}`}
              aria-current={i === current}
              // 24px hit area around a small visible dot
              className="grid size-6 place-items-center"
            >
              <span
                className={`block h-2 rounded-full shadow-[0_1px_4px_rgba(0,0,0,.35)] transition-all ${
                  i === current ? 'w-5 bg-white' : 'w-2 bg-white/55'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
