import type { ReactNode } from 'react'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  /** Right-aligned slot (link, arrows…) */
  aside?: ReactNode
}

export default function SectionHeading({ eyebrow, title, aside }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="flex max-w-xl flex-col gap-1.5">
        <span className="text-[13px] font-bold tracking-[.08em] text-brand-700 uppercase">{eyebrow}</span>
        <h2 className="text-[clamp(26px,3.2vw,36px)] font-extrabold tracking-tight">{title}</h2>
      </div>
      {aside}
    </div>
  )
}
