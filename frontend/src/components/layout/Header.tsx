import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '@/components/ui/Icon'
import Logo from '@/components/ui/Logo'
import { icons } from '@/content/home'
import { useMe } from '@/hooks/useMe'
import { useServices } from '@/hooks/useServices'
import { formatFrom } from '@/lib/format'
import { matchServices } from '@/lib/search'

export default function Header() {
  const { services } = useServices()
  const { me } = useMe()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const search = () => {
    const best = matchServices(services, query)[0] ?? services[0]
    if (!best) return
    setQuery('')
    navigate(`/services/${best.id}`)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200 bg-white">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-4 px-5">
        <Link to="/" onClick={() => setMenuOpen(false)} aria-label="HomeCrew — მთავარი">
          <Logo />
        </Link>

        {/* Desktop */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          className="hidden items-center gap-2 rounded-[10px] bg-surface-50 px-3.5 py-2.5 text-sm font-semibold lg:flex"
        >
          კატეგორიები <span className={`text-[10px] text-ink-500 transition ${menuOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            search()
          }}
          className="hidden h-[42px] max-w-[420px] flex-1 items-center gap-2.5 rounded-full border border-surface-200 px-4 lg:flex"
        >
          <Icon path={icons.search} size={18} strokeWidth={2} className="text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="მოძებნე სერვისი"
            aria-label="მოძებნე სერვისი"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </form>
        <div className="flex-1" />
        <a href="#" className="hidden text-sm font-semibold whitespace-nowrap hover:text-brand-700 lg:block">
          გახდი ხელოსანი
        </a>
        {me ? (
          <Link
            to="/account"
            aria-label={`ჩემი ანგარიში — ${me.name}`}
            title={me.name}
            className="hidden size-[42px] place-items-center rounded-full bg-navy-900 text-sm font-extrabold text-white hover:bg-navy-800 lg:grid"
          >
            {me.initials}
          </Link>
        ) : (
          <Link
            to="/login"
            className="hidden rounded-[10px] border border-surface-300 px-4 py-2.5 text-sm font-semibold hover:border-navy-900 lg:block"
          >
            შესვლა
          </Link>
        )}

        {/* Mobile */}
        <button
          type="button"
          aria-label="ძებნა"
          onClick={() => {
            setMenuOpen(false)
            navigate('/#search')
          }}
          className="grid size-11 place-items-center rounded-xl bg-surface-50 lg:hidden"
        >
          <Icon path={icons.search} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label={menuOpen ? 'მენიუს დახურვა' : 'მენიუ'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="grid size-11 place-items-center rounded-xl bg-navy-900 text-white lg:hidden"
        >
          <Icon path={menuOpen ? icons.close : icons.menu} strokeWidth={2} />
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-surface-200 bg-white shadow-[0_16px_32px_rgba(11,31,58,.10)]">
          <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2 p-5">
            {services.map((s) => (
              <Link
                key={s.id}
                to={`/services/${s.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-surface-50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-brand-50 text-brand-700">
                  <Icon path={s.icon} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">{s.name}</span>
                  <span className="text-xs text-ink-500">{formatFrom(s.priceFrom)}</span>
                </span>
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-surface-200 p-5 lg:hidden">
            <a href="#" className="flex min-h-11 items-center font-semibold">
              გახდი ხელოსანი
            </a>
            <Link
              to={me ? '/account' : '/login'}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center justify-center rounded-[10px] border border-surface-300 font-semibold"
            >
              {me ? `ჩემი ანგარიში · ${me.name}` : 'შესვლა'}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
