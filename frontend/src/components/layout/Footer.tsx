import Logo from '@/components/ui/Logo'
import { footerColumns } from '@/content/home'

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-mist-300">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-8 px-5 pt-14 pb-8">
        <div className="flex min-w-[200px] flex-col gap-3.5">
          <Logo variant="dark" />
          <p className="text-sm leading-relaxed">
            შემოწმებული ადგილობრივი ხელოსნები ყველა საოჯახო საქმისთვის, წინასწარი ფასით.
          </p>
        </div>
        {footerColumns.map((col) => (
          <div key={col.heading} className="flex flex-col gap-2.5">
            <span className="text-[13px] font-bold tracking-[.06em] text-white uppercase">{col.heading}</span>
            {col.links.map((l) => (
              <a key={l} href="#" className="py-1 text-sm hover:text-white">
                {l}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-3 border-t border-[#1a2d4a] p-5 text-[13px] text-mist-400">
        <span>© 2026 HomeCrew შპს</span>
        <span className="flex gap-4">
          <a href="#" className="hover:text-white">კონფიდენციალურობა</a>
          <a href="#" className="hover:text-white">პირობები</a>
          <a href="#" className="hover:text-white">ქუქი-ფაილები</a>
        </span>
      </div>
    </footer>
  )
}
