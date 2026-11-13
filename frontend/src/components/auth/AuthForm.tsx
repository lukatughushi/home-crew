// Login / sign-up form. Used on /login and inline in the booking flow (step 4), so a guest
// can create an account without losing what they picked.
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import { useSetMe } from '@/hooks/useMe'
import { account } from '@/services/api'
import type { Me } from '@/types'

type Mode = 'login' | 'register'

/** Server messages are English (API); show Georgian ones on the site. */
function authError(err: unknown, mode: Mode): string {
  if (isAxiosError(err)) {
    const status = err.response?.status
    if (!err.response) return 'სერვერთან კავშირი ვერ დამყარდა'
    if (status === 401) return 'ელფოსტა ან პაროლი არასწორია'
    if (status === 409) return 'ამ ელფოსტით ანგარიში უკვე არსებობს — შედი'
    if (status === 429) return 'ძალიან ბევრი მცდელობა — სცადე 15 წუთში'
    if (status === 400) return mode === 'register' ? 'შეამოწმე ველები: სახელი, სწორი ელფოსტა, პაროლი მინ. 8 სიმბოლო' : 'შეამოწმე ელფოსტა'
  }
  return 'რაღაც შეცდომა მოხდა — სცადე თავიდან'
}

const field =
  'min-h-[52px] rounded-xl border-[1.5px] border-surface-300 px-3.5 text-base font-normal text-navy-900 outline-brand-700'

export default function AuthForm({
  initialMode = 'login',
  onDone,
}: {
  initialMode?: Mode
  onDone?: (me: Me) => void
}) {
  const setMe = useSetMe()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  const submit = useMutation({
    mutationFn: () =>
      mode === 'login'
        ? account.login(form.email, form.password)
        : account.register({ name: form.name, email: form.email, password: form.password, phone: form.phone }),
    onSuccess: (me) => {
      setMe(me)
      onDone?.(me)
    },
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit.mutate()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 self-start rounded-xl bg-surface-200 p-1" role="tablist">
        {(
          [
            ['login', 'შესვლა'],
            ['register', 'რეგისტრაცია'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id)
              submit.reset()
            }}
            className={`min-h-10 rounded-[9px] px-4 text-sm font-bold ${mode === id ? 'bg-white shadow-[0_1px_3px_rgba(11,31,58,.12)]' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <label className="flex flex-col gap-2 text-sm font-bold">
            სახელი და გვარი
            <input required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={set('name')} className={field} />
          </label>
        )}
        <label className="flex flex-col gap-2 text-sm font-bold">
          ელფოსტა
          <input required type="email" autoComplete="email" value={form.email} onChange={set('email')} className={field} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-bold">
          პაროლი
          {mode === 'register' && <span className="-mt-1 text-[13px] font-medium text-ink-500">მინიმუმ 8 სიმბოლო</span>}
          <input
            required
            type="password"
            minLength={mode === 'register' ? 8 : 1}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={set('password')}
            className={field}
          />
        </label>
        {mode === 'register' && (
          <label className="flex flex-col gap-2 text-sm font-bold">
            ტელეფონი <span className="-mt-1 text-[13px] font-medium text-ink-500">არასავალდებულო — ხელოსანი დაგიკავშირდება</span>
            <input type="tel" autoComplete="tel" placeholder="+995 5XX XX XX XX" value={form.phone} onChange={set('phone')} className={field} />
          </label>
        )}

        {submit.isError && (
          <p role="alert" className="rounded-xl bg-[#FEF2F2] px-3.5 py-2.5 text-sm font-semibold text-[#B42318]">
            {authError(submit.error, mode)}
          </p>
        )}

        <button
          type="submit"
          disabled={submit.isPending}
          className="min-h-[52px] rounded-xl bg-brand-700 text-base font-extrabold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {submit.isPending ? 'ერთი წამი…' : mode === 'login' ? 'შესვლა' : 'ანგარიშის შექმნა'}
        </button>
        {mode === 'register' && (
          <p className="text-center text-[13px] text-ink-500">
            ახალ ანგარიშს 1 000 ₾ სატესტო თანხა დაერიცხება — ნამდვილი გადახდა ჯერ არ არის ჩართული.
          </p>
        )}
      </form>
    </div>
  )
}
