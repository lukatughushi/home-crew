import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { primaryBtn } from '@/components/admin/ui'
import { useAdmin } from '@/hooks/useAdmin'
import { ADMIN_ME } from '@/lib/queryClient'
import { adminApi, errorMessage } from '@/services/adminApi'
import { isAxiosError } from 'axios'

// Not part of the admin design — styled to match it (navy + emerald).
export default function LoginPage() {
  const [params] = useSearchParams()
  const next = params.get('next')?.startsWith('/admin') ? params.get('next')! : '/admin'
  const { data: admin } = useAdmin()
  const qc = useQueryClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = useMutation({
    mutationFn: () => adminApi.login(email, password),
    onSuccess: (me) => qc.setQueryData(ADMIN_ME, me),
  })

  if (admin) return <Navigate to={next} replace />

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate()
  }

  const status = isAxiosError(login.error) ? login.error.response?.status : undefined
  const error =
    status === 401
      ? 'ელფოსტა ან პაროლი არასწორია.'
      : status === 429
        ? 'ძალიან ბევრი მცდელობა. სცადე 15 წუთში.'
        : login.error
          ? errorMessage(login.error)
          : null

  return (
    <div className="grid min-h-screen place-items-center bg-navy-900 p-4">
      <form onSubmit={onSubmit} className="flex w-full max-w-[400px] flex-col gap-5 rounded-panel bg-white p-7 shadow-[0_16px_48px_rgba(0,0,0,.3)]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-[9px] bg-navy-900">
            <span className="size-3 rotate-45 rounded-[3px] bg-brand-500" />
          </span>
          <span className="flex flex-col">
            <span className="text-[17px] font-extrabold tracking-tight">HomeCrew</span>
            <span className="text-[11px] font-bold tracking-[.08em] text-ink-500">ADMIN</span>
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">შესვლა</h1>

        <label className="flex flex-col gap-2 text-sm font-bold">
          ელფოსტა
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 rounded-xl border-[1.5px] border-surface-300 px-3.5 text-[15px] font-normal outline-brand-700"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-bold">
          პაროლი
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-12 rounded-xl border-[1.5px] border-surface-300 px-3.5 text-[15px] font-normal outline-brand-700"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-[10px] bg-[#FEF2F2] px-3.5 py-2.5 text-sm font-semibold text-[#B42318]">
            {error}
          </p>
        )}

        <button type="submit" disabled={login.isPending} className={`${primaryBtn} min-h-12 text-[15px]`}>
          {login.isPending ? 'მოწმდება…' : 'შესვლა'}
        </button>
      </form>
    </div>
  )
}
