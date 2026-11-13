import { Link } from 'react-router-dom'
import Icon from '@/components/ui/Icon'
import SectionHeading from '@/components/ui/SectionHeading'
import { useServices } from '@/hooks/useServices'
import { formatFrom } from '@/lib/format'

export default function CategoryGrid() {
  const { services, loading, error } = useServices()

  return (
    <section id="categories" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-16">
      <SectionHeading
        eyebrow="სერვისები"
        title="რაში დაგეხმაროთ?"
        aside={
          <a href="#" className="text-[15px] font-bold text-brand-700 hover:underline">
            ყველა სერვისი →
          </a>
        }
      />

      {error ? (
        <p className="rounded-card border border-surface-200 bg-white p-5 text-ink-500">
          სერვისები ვერ ჩაიტვირთა. შეამოწმე, რომ backend მუშაობს (localhost:5000).
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="min-h-[168px] animate-pulse rounded-card border border-surface-200 bg-white" />
              ))
            : services.map((s) => (
                <Link
                  key={s.id}
                  to={`/services/${s.id}`}
                  className="flex min-h-[168px] flex-col gap-4 rounded-card border border-surface-200 bg-white p-5 transition hover:border-brand-700 hover:shadow-[0_8px_24px_rgba(11,31,58,.08)]"
                >
                  <span className="grid size-[52px] place-items-center rounded-[14px] bg-brand-50 text-brand-700">
                    <Icon path={s.icon} size={26} />
                  </span>
                  <span className="mt-auto flex flex-col gap-1">
                    <span className="text-base leading-tight font-bold">{s.name}</span>
                    <span className="text-[13px] text-ink-500">{formatFrom(s.priceFrom)}</span>
                  </span>
                </Link>
              ))}
        </div>
      )}
    </section>
  )
}
