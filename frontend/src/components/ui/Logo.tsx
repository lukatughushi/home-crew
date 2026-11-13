interface LogoProps {
  variant?: 'light' | 'dark'
}

/** Navy tile with a rotated emerald diamond (light bg) — inverted for the footer (dark bg). */
export default function Logo({ variant = 'light' }: LogoProps) {
  const dark = variant === 'dark'
  return (
    <span className={`flex items-center gap-2.5 ${dark ? 'text-white' : 'text-navy-900'}`}>
      <span
        className={`grid size-8 place-items-center rounded-[9px] ${dark ? 'bg-brand-500' : 'bg-navy-900'}`}
      >
        <span className={`size-3 rotate-45 rounded-[3px] ${dark ? 'bg-navy-950' : 'bg-brand-500'}`} />
      </span>
      <span className="text-lg font-extrabold tracking-tight">HomeCrew</span>
    </span>
  )
}
