export interface HealthResponse {
  status: 'ok'
  service: string
  timestamp: string
}

export interface ServicePackage {
  id: number
  name: string
  price: number
  description: string
  isPopular: boolean
  sortOrder: number
}

export interface ServiceCategory {
  id: string
  name: string
  service: string
  keywords: string
  /** Cheapest package price; null when the service has no packages */
  priceFrom: number | null
  /** Average of real reviews; null until the first review */
  rating: number | null
  reviews: number
  /** Active pros offering this service */
  pros: number
  /** Alt text for the photo */
  photo: string
  /** Uploaded photo, e.g. "/uploads/….jpg"; empty when none */
  photoUrl: string
  /** SVG path data for a 24×24 viewBox */
  icon: string
  description: string
  packages: ServicePackage[]
  included: string[]
  excluded: string[]
  isActive: boolean
  sortOrder: number
}

/** Public site settings (GET /api/site) */
export interface SiteSettings {
  /** Homepage slider photos in display order, e.g. ["/uploads/….jpg"]; empty when none */
  heroSlides: string[]
}

// ─── Website accounts & booking ──────────────────────────────────

/** Logged-in customer (GET /api/account/me); null when logged out */
export interface Me {
  id: number
  name: string
  email: string
  phone: string
  initials: string
  /** Test wallet balance, ₾ */
  balance: number
  createdAt: string
  /** "Add test money" button allowed (off in production) */
  canTopUp: boolean
}

/** Pro shown on the service page and booking step 3 */
export interface ServicePro {
  id: number
  name: string
  initials: string
  tag: string
  district: string
  experienceYears: number
  rating: number | null
  reviews: number
  jobs: number
}

export type PropertyType = 'HOUSE' | 'APARTMENT' | 'OFFICE'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ON_THE_WAY' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'

export interface NewBooking {
  serviceId: string
  packageId: number
  proId?: number
  phone: string
  address: string
  propertyType: PropertyType
  notes: string
  date: string
  slot: string
}

export interface CreatedBooking {
  id: number
  code: string
  status: BookingStatus
  total: number
}

export interface MyBooking {
  id: number
  code: string
  status: BookingStatus
  service: { id: string; name: string; service: string; icon: string }
  package: { id: number; name: string } | null
  pro: { id: number; name: string; initials: string } | null
  address: string
  date: string
  slot: string
  total: number
  refundedAmount: number
  upcoming: boolean
  rating: number | null
  canReview: boolean
  canCancel: boolean
  cancelNote: string
  createdAt: string
}

export interface WalletTransaction {
  id: number
  type: 'TOPUP' | 'PAYMENT' | 'REFUND'
  amount: number
  note: string
  bookingCode: string | null
  createdAt: string
}

