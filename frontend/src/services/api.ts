import axios from 'axios'
import type {
  CreatedBooking,
  HealthResponse,
  Me,
  MyBooking,
  NewBooking,
  ServiceCategory,
  ServicePro,
  SiteSettings,
  WalletTransaction,
} from '@/types'

// In dev, Vite proxies /api to http://localhost:5000 (see vite.config.ts).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/health')
  return data
}

export async function getServices(): Promise<ServiceCategory[]> {
  const { data } = await api.get<ServiceCategory[]>('/services')
  return data
}

export async function getService(id: string): Promise<ServiceCategory> {
  const { data } = await api.get<ServiceCategory>(`/services/${id}`)
  return data
}

export async function getSite(): Promise<SiteSettings> {
  const { data } = await api.get<SiteSettings>('/site')
  return data
}

export const getServicePros = (id: string) => api.get<ServicePro[]>(`/services/${id}/pros`).then((r) => r.data)

// ─── Website account (cookie session) ────────────────────────────

export const account = {
  me: () => api.get<Me | null>('/account/me').then((r) => r.data),
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    api.post<Me>('/account/register', body).then((r) => r.data),
  login: (email: string, password: string) => api.post<Me>('/account/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/account/logout').then(() => undefined),
  update: (body: { name?: string; phone?: string }) => api.patch<Me>('/account/me', body).then((r) => r.data),
  bookings: () => api.get<MyBooking[]>('/account/bookings').then((r) => r.data),
  cancelBooking: (id: number) => api.post<MyBooking>(`/account/bookings/${id}/cancel`).then((r) => r.data),
  reviewBooking: (id: number, rating: number, quote: string) =>
    api.post<MyBooking>(`/account/bookings/${id}/review`, { rating, quote }).then((r) => r.data),
  transactions: () => api.get<WalletTransaction[]>('/account/transactions').then((r) => r.data),
  topUp: () => api.post<Me>('/account/wallet/topup').then((r) => r.data),
}

export const createBooking = (b: NewBooking) => api.post<CreatedBooking>('/bookings', b).then((r) => r.data)

