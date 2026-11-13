import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AuthForm from '@/components/auth/AuthForm'
import { useMe } from '@/hooks/useMe'

/** Only same-site paths, so ?next= can't send people to another website. */
const safeNext = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '/account')

export default function LoginPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { me, loading } = useMe()
  const next = safeNext(params.get('next'))

  if (!loading && me) return <Navigate to={next} replace />

  return (
    <div className="mx-auto flex max-w-[440px] flex-col gap-6 px-5 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-[clamp(26px,4vw,32px)] font-extrabold tracking-tight">კეთილი იყოს შენი მობრძანება</h1>
        <p className="text-[15px] text-ink-500">შედი ან შექმენი ანგარიში — ჯავშნები, გადახდები და ისტორია ერთ ადგილას.</p>
      </div>
      <div className="rounded-panel border border-surface-200 bg-white p-6 shadow-[0_8px_32px_rgba(11,31,58,.06)]">
        <AuthForm
          initialMode={params.get('mode') === 'register' ? 'register' : 'login'}
          onDone={() => navigate(next, { replace: true })}
        />
      </div>
    </div>
  )
}
