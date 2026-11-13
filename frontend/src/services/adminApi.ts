import { isAxiosError } from 'axios'
import { api } from './api'
import type {
  AdminBooking,
  AdminDispute,
  AdminPro,
  AdminReview,
  AdminService,
  AdminUser,
  Badges,
  BookingDetail,
  BookingList,
  BookingStatus,
  DashboardStats,
  DisputeResolution,
  MediaState,
  PayoutsData,
} from '@/types/admin'

const get = <T>(url: string, params?: object) => api.get<T>(`/admin${url}`, { params }).then((r) => r.data)
const post = <T>(url: string, body?: unknown) => api.post<T>(`/admin${url}`, body).then((r) => r.data)
const patch = <T>(url: string, body?: unknown) => api.patch<T>(`/admin${url}`, body).then((r) => r.data)
const put = <T>(url: string, body?: unknown) => api.put<T>(`/admin${url}`, body).then((r) => r.data)
const del = (url: string) => api.delete(`/admin${url}`).then(() => undefined)

export const MAX_IMAGE_MB = 5
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
/** Sends the file as the raw request body (no multipart needed). */
const sendImage = (method: 'post' | 'put', url: string, file: File) =>
  api[method]<MediaState>(`/admin${url}`, file, { headers: { 'Content-Type': file.type } }).then((r) => r.data)

export const isUnauthorized = (err: unknown) => isAxiosError(err) && err.response?.status === 401

/** Server message for a failed request, for toasts. */
export function errorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string } | undefined)?.message
    if (msg) return msg
    if (!err.response) return 'სერვერთან კავშირი ვერ დამყარდა'
  }
  return 'რაღაც შეცდომა მოხდა'
}

export const adminApi = {
  // auth
  /** null when not logged in */
  me: () => get<AdminUser>('/auth/me').catch((err) => (isUnauthorized(err) ? null : Promise.reject(err))),
  login: (email: string, password: string) => post<AdminUser>('/auth/login', { email, password }),
  logout: () => post<void>('/auth/logout'),

  // dashboard
  stats: () => get<DashboardStats>('/stats'),
  badges: () => get<Badges>('/badges'),

  // bookings
  bookings: (params: { status?: BookingStatus; q?: string; page?: number }) => get<BookingList>('/bookings', params),
  booking: (id: number) => get<BookingDetail>(`/bookings/${id}`),
  updateBooking: (id: number, body: { status?: BookingStatus; proId?: number | null }) =>
    patch<AdminBooking>(`/bookings/${id}`, body),
  cancelBooking: (id: number) => post<AdminBooking>(`/bookings/${id}/cancel`),
  refundBooking: (id: number) => post<AdminBooking>(`/bookings/${id}/refund`),

  // pros
  pros: (status?: AdminPro['status']) => get<AdminPro[]>('/pros', status && { status }),
  setProActive: (id: number, isActive: boolean) => patch<AdminPro>(`/pros/${id}`, { isActive }),
  setProDocument: (id: number, docId: number, isVerified: boolean) =>
    patch<AdminPro>(`/pros/${id}/documents/${docId}`, { isVerified }),
  approvePro: (id: number) => post<AdminPro>(`/pros/${id}/approve`),
  rejectPro: (id: number) => post<AdminPro>(`/pros/${id}/reject`),
  requestProDocs: (id: number) => post<AdminPro>(`/pros/${id}/request-docs`),

  // services
  services: () => get<AdminService[]>('/services'),
  saveServices: (rows: { id: string; priceFrom: number; commissionPercent: number; isActive: boolean }[]) =>
    patch<AdminService[]>('/services', rows),

  // payouts
  payouts: () => get<PayoutsData>('/payouts'),
  payPro: (proId: number) => post<{ id: number; net: number }>('/payouts', { proId }),
  payAll: () => post<{ count: number; net: number }>('/payouts/all'),

  // disputes
  disputes: () => get<AdminDispute[]>('/disputes'),
  resolveDispute: (id: number, resolution: DisputeResolution) => post<void>(`/disputes/${id}/resolve`, { resolution }),

  // reviews
  reviews: () => get<AdminReview[]>('/reviews'),
  saveReview: (r: AdminReview) =>
    put<AdminReview>(`/reviews/${r.id}`, {
      authorName: r.authorName,
      meta: r.meta,
      quote: r.quote,
      rating: r.rating,
      isPublished: r.isPublished,
      sortOrder: r.sortOrder,
      bookingId: r.bookingId,
    }),
  createReview: (r: { authorName: string; meta: string; quote: string; rating: number; isPublished: boolean }) =>
    post<AdminReview>('/reviews', r),
  deleteReview: (id: number) => del(`/reviews/${id}`),

  // images
  media: () => get<MediaState>('/media'),
  addHeroSlide: (file: File) => sendImage('post', '/media/hero', file),
  removeHeroSlide: (id: number) => api.delete<MediaState>(`/admin/media/hero/${id}`).then((r) => r.data),
  reorderHeroSlides: (ids: number[]) => put<MediaState>('/media/hero/order', { ids }),
  uploadServicePhoto: (id: string, file: File) => sendImage('put', `/media/services/${id}`, file),
  removeServicePhoto: (id: string) => api.delete<MediaState>(`/admin/media/services/${id}`).then((r) => r.data),
}
