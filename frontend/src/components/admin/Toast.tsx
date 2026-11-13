import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastKind } from './toastContext'

/** Bottom-centre toast from the admin design. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback((msg: string, kind: ToastKind = 'success') => {
    clearTimeout(timer.current)
    setToast({ msg, kind })
    timer.current = setTimeout(() => setToast(null), kind === 'error' ? 4000 : 2400)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2.5 rounded-xl bg-navy-900 px-[18px] py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(11,31,58,.3)]"
        >
          <span className={`font-extrabold ${toast.kind === 'error' ? 'text-[#F87171]' : 'text-brand-500'}`}>
            {toast.kind === 'error' ? '!' : '✓'}
          </span>
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  )
}
