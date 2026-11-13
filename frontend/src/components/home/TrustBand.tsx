import Icon from '@/components/ui/Icon'
import { trust } from '@/content/home'

export default function TrustBand() {
  return (
    <section className="bg-navy-900 text-white">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8 px-5 py-16">
        {trust.map((b) => (
          <div key={b.title} className="flex items-start gap-4">
            <span className="grid size-[52px] shrink-0 place-items-center rounded-full border-[1.5px] border-brand-500 text-brand-500">
              <Icon path={b.icon} size={24} />
            </span>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-bold">{b.title}</h3>
              <p className="text-[15px] leading-relaxed text-pretty text-mist-300">{b.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
