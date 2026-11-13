import { createContext, useContext } from 'react'

export type ToastKind = 'success' | 'error'
export const ToastContext = createContext<(msg: string, kind?: ToastKind) => void>(() => {})

/** Show a toast: toast('შენახულია') or toast('შეცდომა', 'error') */
export const useToast = () => useContext(ToastContext)
