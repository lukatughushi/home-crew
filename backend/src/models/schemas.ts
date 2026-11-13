// Request-body validation (zod). Shared by public + admin controllers.
import { z } from 'zod'
import { SLOTS } from './booking.model.js'

const text = z.string().trim()
const id = z.coerce.number().int().positive()
const money = z.coerce.number().min(0).max(1_000_000)
const percent = z.coerce.number().min(0).max(100)

export const idParam = z.object({ id })

// ─── Services ────────────────────────────────────────────────────

export const packageInput = z.object({
  id: id.optional(), // present = update existing, absent = create
  name: text.min(1).max(80),
  description: text.max(200).default(''),
  price: money,
  isPopular: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})

export const serviceInput = z.object({
  id: text
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase latin letters, digits and dashes'),
  name: text.min(1).max(80),
  service: text.min(1).max(120),
  keywords: text.max(300).default(''),
  description: text.max(2000).default(''),
  photo: text.max(200).default(''),
  icon: text.max(2000).default(''),
  included: z.array(text.min(1).max(200)).max(20).default([]),
  excluded: z.array(text.min(1).max(200)).max(20).default([]),
  priceFrom: money.default(0),
  commissionPercent: percent.default(15),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  packages: z.array(packageInput).max(10).default([]),
})

/** Slug can't change on update (it's the URL + foreign key). */
export const serviceUpdate = serviceInput.omit({ id: true })

/** "სერვისები და ფასები" table: save several rows at once. */
export const servicesBulkUpdate = z
  .array(
    z.object({
      id: text.min(1),
      priceFrom: money,
      commissionPercent: percent,
      isActive: z.boolean(),
    }),
  )
  .min(1)
  .max(100)

// ─── Pros ────────────────────────────────────────────────────────

const proStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const

export const proInput = z.object({
  name: text.min(1).max(80),
  phone: text.max(30).default(''),
  email: z.union([z.literal(''), z.email()]).default(''),
  district: text.max(60).default(''),
  experienceYears: z.number().int().min(0).max(80).default(0),
  tag: text.max(40).default(''),
  isActive: z.boolean().default(true),
  serviceIds: z.array(text).max(50).default([]),
})

export const proQuery = z.object({ status: z.enum(proStatuses).optional() })
export const proPatch = z.object({ isActive: z.boolean() })
export const proDocParams = z.object({ id, docId: id })
export const proDocPatch = z.object({ isVerified: z.boolean() })

// ─── Bookings ────────────────────────────────────────────────────

const statuses = ['PENDING', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'] as const
const propertyTypes = ['HOUSE', 'APARTMENT', 'OFFICE'] as const
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')

/** Public booking form (customer). Price is taken from the package, never from the client. */
/** Website booking. Name and email come from the logged-in account. */
export const bookingCreate = z.object({
  serviceId: text.min(1),
  packageId: id,
  proId: id.optional(),
  phone: text.min(5).max(30),
  address: text.min(3).max(200),
  district: text.max(60).default(''),
  propertyType: z.enum(propertyTypes).default('APARTMENT'),
  notes: text.max(500).default(''),
  date: isoDate,
  slot: z.enum(SLOTS),
})

/** Admin: change status and/or (un)assign a pro. */
export const bookingUpdate = z
  .object({
    status: z.enum(statuses).optional(),
    proId: id.nullable().optional(),
  })
  .refine((v) => v.status !== undefined || v.proId !== undefined, 'Nothing to update')

export const bookingQuery = z.object({
  status: z.enum(statuses).optional(),
  q: text.max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

// ─── Disputes / payouts ──────────────────────────────────────────

export const disputeResolve = z.object({
  resolution: z.enum(['REVISIT', 'REFUND_HALF', 'REFUND_FULL', 'REJECTED']),
})

export const payoutCreate = z.object({ proId: id })

// ─── Reviews ─────────────────────────────────────────────────────

export const reviewInput = z.object({
  authorName: text.min(1).max(80),
  meta: text.max(120).default(''),
  quote: text.min(1).max(1000),
  rating: z.number().int().min(1).max(5).default(5),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  bookingId: id.nullable().default(null),
})

// ─── Auth ────────────────────────────────────────────────────────

export const loginInput = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(200),
})

// ─── Website accounts ────────────────────────────────────────────

export const registerInput = z.object({
  name: text.min(2).max(80),
  email: z.email().trim().toLowerCase().max(200),
  password: z.string().min(8).max(200),
  phone: text.max(30).default(''),
})

export const profileUpdate = z
  .object({ name: text.min(2).max(80).optional(), phone: text.max(30).optional() })
  .refine((v) => v.name !== undefined || v.phone !== undefined, 'Nothing to update')

export const customerReviewInput = z.object({
  rating: z.number().int().min(1).max(5),
  quote: text.max(1000).default(''),
})
