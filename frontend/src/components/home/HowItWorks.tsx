import Icon from '@/components/ui/Icon'
import SectionHeading from '@/components/ui/SectionHeading'
import { steps } from '@/content/home'

export default function HowItWorks() {
  return (
    <section className="border-y border-surface-200 bg-white">
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <SectionHeading eyebrow="როგორ მუშაობს" title="დაჯავშნე წუთებში — შესრულდება ხარისხიანად." />
        <ol className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {steps.map((st) => (
            <li key={st.n} className="flex flex-col gap-4 rounded-panel bg-surface-50 p-7">
              <div className="flex items-center justify-between">
                <span className="grid size-14 place-items-center rounded-card bg-navy-900 text-brand-500">
                  <Icon path={st.icon} size={26} />
                </span>
                <span className="font-mono text-sm font-medium text-ink-500">{st.n}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">{st.title}</h3>
              <p className="text-[15px] leading-relaxed text-pretty text-ink-500">{st.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
