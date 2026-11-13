import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-4 px-5 py-24">
      <span className="font-mono text-sm text-ink-500">404</span>
      <h1 className="text-3xl font-extrabold tracking-tight">გვერდი ვერ მოიძებნა</h1>
      <Link to="/" className="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white hover:bg-brand-800">
        მთავარზე დაბრუნება
      </Link>
    </div>
  )
}
