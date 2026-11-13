import type { ServiceCategory } from './index'

export interface AdminUser {
  id: number
  email: string
  name: string
  title: string
}

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'

export type PaymentState = 'HELD' | 'CHARGED' | 'RELEASED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

export interface AdminBooking {
  id: number
  code: string
  status: BookingStatus
  service: { id: string; name: string; service: string }
  package: { id: number; name: string } | null
  pro: { id: number; name: string } | null
  customerName: string
  customerPhone: string
  customerEmail: string
  address: string
  district: string
  propertyType: 'HOUSE' | 'APARTMENT' | 'OFFICE'
  notes: string
  /** YYYY-MM-DD */
  date: string
  /** "10–12" */
  slot: string
  price: number
  fee: number
  total: number
  refundedAmount: number
  paymentState: PaymentState
  isPaidOut: boolean
  createdAt: string
}

export interface BookingDetail extends AdminBooking {
  events: { id: number; message: string; createdAt: string }[]
  eligiblePros: { id: number; name: string; rating: number | null }[]
}

export interface BookingList {
  items: AdminBooking[]
  total: number
  page: number
  pageSize: number
  counts: Partial<Record<BookingStatus, number>>
}

export interface Badges {
  pendingBookings: number
  pendingPros: number
  openDisputes: number
  unpaidPros: number
}

export interface DashboardStats {
  today: string
  bookingsToday: number
  bookingsChange: number | null
  revenueToday: number
  revenueChange: number | null
  activePros: number
  prosOnJob: number
  avgRating: number | null
  ratingChange30d: number | null
  attention: {
    pendingBookings: number
    pendingPros: number
    openDisputes: number
    nextDisputeDeadline: string | null
  }
  chart: { date: string; count: number }[]
  categorySplit: { serviceId: string; name: string; count: number; percent: number }[]
  latestBookings: AdminBooking[]
}

export interface AdminService extends ServiceCategory {
  commissionPercent: number
}

export interface AdminPro {
  id: number
  name: string
  initials: string
  phone: string
  email: string
  district: string
  experienceYears: number
  tag: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  isActive: boolean
  services: { id: string; name: string }[]
  documents: { id: number; name: string; isVerified: boolean }[]
  docsRequestedAt: string | null
  createdAt: string
  jobs: number
  cancelRate: number
  rating: number | null
  reviews: number
}

export interface PayoutRow {
  proId: number
  proName: string
  jobs: number
  gross: number
  commission: number
  net: number
  periodStart: string
  periodEnd: string
  paidAt: string | null
}

export interface PayoutsData {
  heldAmount: number
  heldBookings: number
  toPay: number
  toPayPros: number
  commissionWeek: number
  avgCommissionPercent: number | null
  periodStart: string | null
  periodEnd: string | null
  rows: PayoutRow[]
}

export type DisputeResolution = 'REVISIT' | 'REFUND_HALF' | 'REFUND_FULL' | 'REJECTED'

export interface AdminDispute {
  id: number
  bookingId: number
  code: string
  service: string
  package: string | null
  total: number
  customerName: string
  pro: { id: number; name: string } | null
  reason: string
  photos: number
  proReply: string
  deadline: string
  resolution: DisputeResolution | null
  resolvedAt: string | null
  refundedAmount: number
}

export interface AdminReview {
  id: number
  authorName: string
  meta: string
  quote: string
  rating: number
  isPublished: boolean
  sortOrder: number
  bookingId: number | null
  booking: { id: number; code: string } | null
  createdAt: string
}

export interface MediaState {
  heroSlides: { id: number; url: string }[]
  maxHeroSlides: number
  services: { id: string; name: string; photo: string; photoUrl: string; icon: string; isActive: boolean }[]
}
