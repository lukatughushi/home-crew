import { useQueryClient } from '@tanstack/react-query'
import { Navigate, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '@/components/ui/Icon'
import { useAdmin, useBadges } from '@/hooks/useAdmin'
import { longToday } from '@/lib/adminFormat'
import { ADMIN_ME } from '@/lib/queryClient'
import { initials } from '@/lib/text'
import { adminApi } from '@/services/adminApi'
import type { Badges } from '@/types/admin'
import { ToastProvider } from './Toast'

interface NavItem {
  to: string
  label: string
  subtitle: string | (() => string)
  icon: string
  badge?: keyof Badges
  badgeBg?: string
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'მიმოხილვა', subtitle: () => `${longToday()} · თბილისი`, icon: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z' },
  { to: '/admin/bookings', label: 'ჯავშნები', subtitle: 'ყველა ჯავშანი რეალურ დროში', icon: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', badge: 'pendingBookings', badgeBg: '#FBBF24' },
  { to: '/admin/pros', label: 'ხელოსნები', subtitle: 'ვერიფიკაცია და აქტიური ხელოსნები', icon: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 11l2 2 4-4', badge: 'pendingPros', badgeBg: '#10B981' },
  { to: '/admin/services', label: 'სერვისები და ფასები', subtitle: 'კატეგორიების საწყისი ფასი და საკომისიო', icon: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01' },
  { to: '/admin/payments', label: 'გადახდები', subtitle: 'დაბლოკილი თანხები და ხელოსნების გადარიცხვები', icon: 'M3 6h18v12H3zM3 10h18M7 15h4', badge: 'unpaidPros', badgeBg: '#9FB0C8' },
  { to: '/admin/disputes', label: 'დავები', subtitle: 'პასუხი 24 საათში — SLA', icon: 'M12 3l9 16H3zM12 10v4M12 17h.01', badge: 'openDisputes', badgeBg: '#F87171' },
  { to: '/admin/reviews', label: 'შეფასებები', subtitle: 'მთავარ გვერდზე გამოჩენილი შეფასებები', icon: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z' },
  { to: '/admin/media', label: 'სურათები', subtitle: 'მთავარი გვერდის სლაიდერი და სერვისების ფოტოები', icon: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01' },
]

function Mark({ size = 32 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-[9px] bg-brand-500" style={{ width: size, height: size }}>
      <span className="rotate-45 rounded-[3px] bg-navy-900" style={{ width: size * 0.375, height: size * 0.375 }} />
    </span>
  )
}

export default function AdminLayout() {
  const { data: admin, isPending, isError } = useAdmin()
  const location = useLocation()

  if (isPending) {
    return <div className="grid min-h-screen place-items-center bg-surface-50 text-sm text-ink-500">იტვირთება…</div>
  }
  if (isError) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-50 p-5 text-center text-sm text-ink-500">
        სერვერთან კავშირი ვერ დამყარდა. შეამოწმე, რომ backend მუშაობს.
      </div>
    )
  }
  if (!admin) {
    return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  }
  return (
    <ToastProvider>
      <Shell adminName={admin.name} adminTitle={admin.title} />
    </ToastProvider>
  )
}

function Shell({ adminName, adminTitle }: { adminName: string; adminTitle: string }) {
  const { data: badges } = useBadges()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()

  const current = [...NAV].reverse().find((n) => pathname === n.to || pathname.startsWith(n.to + '/')) ?? NAV[0]
  const subtitle = typeof current.subtitle === 'function' ? current.subtitle() : current.subtitle
  const query = pathname === '/admin/bookings' ? (params.get('q') ?? '') : ''
  const attention = badges ? badges.pendingBookings + badges.openDisputes + badges.pendingPros : 0

  const logout = async () => {
    await adminApi.logout().catch(() => {})
    queryClient.clear()
    queryClient.setQueryData(ADMIN_ME, null)
  }

  const badgeOf = (n: NavItem) => (n.badge && badges?.[n.badge]) || 0

  return (
    <div className="flex min-h-screen flex-col bg-surface-50 min-[900px]:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-[252px] shrink-0 flex-col gap-6 bg-navy-900 px-3.5 py-5 text-white min-[900px]:flex">
        <div className="flex items-center gap-2.5 px-2">
          <Mark />
          <span className="flex flex-col">
            <span className="text-[17px] font-extrabold tracking-tight">HomeCrew</span>
            <span className="text-[11px] font-bold tracking-[.08em] text-mist-400">ADMIN</span>
          </span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/admin'}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold hover:bg-navy-800 ${isActive ? 'bg-[#1F3A66] text-white' : 'text-mist-300'}`
              }
            >
              <Icon path={n.icon} size={18} />
              <span className="flex-1">{n.label}</span>
              {badgeOf(n) > 0 && (
                <span
                  className="grid h-[22px] min-w-[22px] place-items-center rounded-full px-1.5 text-[11px] font-extrabold text-navy-900"
                  style={{ background: n.badgeBg }}
                >
                  {badgeOf(n)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 rounded-[14px] bg-navy-800 p-3.5">
          <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-extrabold text-navy-900">
            {initials(adminName)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-bold">{adminName}</span>
            <span className="truncate text-xs text-mist-400">{adminTitle}</span>
          </span>
          <button
            type="button"
            onClick={logout}
            aria-label="გასვლა"
            title="გასვლა"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-mist-400 hover:bg-[#1F3A66] hover:text-white"
          >
            <Icon path="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" size={18} />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20">
          {/* Top bar (mobile) */}
          <div className="flex flex-col gap-3 bg-navy-900 px-4 py-3 text-white min-[900px]:hidden">
            <div className="flex items-center gap-2.5">
              <Mark size={28} />
              <span className="flex-1 text-base font-extrabold">
                HomeCrew <span className="text-[11px] tracking-[.08em] text-mist-400">ADMIN</span>
              </span>
              <button type="button" onClick={logout} className="text-sm font-bold text-mist-300">
                გასვლა
              </button>
            </div>
            <nav className="flex gap-1 overflow-x-auto">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/admin'}
                  className={({ isActive }) =>
                    `flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold whitespace-nowrap ${isActive ? 'bg-white text-navy-900' : 'text-mist-300'}`
                  }
                >
                  {n.label}
                  {badgeOf(n) > 0 && <span className="opacity-70">{badgeOf(n)}</span>}
                </NavLink>
              ))}
            </nav>
          </div>

          <header className="flex flex-wrap items-center gap-4 border-b border-surface-200 bg-white px-4 py-4 sm:px-7">
            <div className="flex flex-[1_1_240px] flex-col gap-0.5">
              <h1 className="text-[22px] font-extrabold tracking-tight">{current.label}</h1>
              <span className="text-[13px] text-ink-500">{subtitle}</span>
            </div>
            <div className="flex min-w-0 flex-[0_1_380px] gap-2">
              <label className="flex h-[42px] min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-surface-200 bg-surface-50 px-3 text-ink-500">
                <Icon path="M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4" size={16} strokeWidth={2} />
                <input
                  value={query}
                  onChange={(e) => {
                    const q = e.target.value
                    navigate(q ? `/admin/bookings?q=${encodeURIComponent(q)}` : '/admin/bookings', {
                      replace: pathname === '/admin/bookings',
                    })
                  }}
                  placeholder="ჯავშნის ID, მომხმარებელი, ხელოსანი"
                  aria-label="ჯავშნების ძებნა"
                  className="min-w-0 flex-1 bg-transparent text-sm text-navy-900 outline-none"
                />
              </label>
              <button
                type="button"
                aria-label={attention ? `${attention} საკითხი ელოდება` : 'შეტყობინებები'}
                title={attention ? `${attention} საკითხი ელოდება` : 'ახალი არაფერია'}
                onClick={() => navigate('/admin')}
                className="relative grid size-[42px] shrink-0 place-items-center rounded-[10px] border border-surface-200 bg-white"
              >
                <Icon path="M6 16V11a6 6 0 1112 0v5l2 2H4zM10 20a2 2 0 004 0" size={18} />
                {attention > 0 && (
                  <span className="absolute top-2 right-[9px] size-2 rounded-full border-2 border-white bg-[#B42318]" />
                )}
              </button>
            </div>
          </header>
        </div>

        <main className="flex w-full max-w-[1440px] flex-col gap-5 px-4 pt-6 pb-16 sm:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
