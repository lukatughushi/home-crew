import type { Prisma } from '../generated/prisma/client.js'
import { round2 } from '../lib/time.js'

export const BOOKING_FEE = 3.5
export const SLOTS = ['08–10', '10–12', '12–14', '14–16', '16–18', '18–20'] as const

/** Statuses where the customer's money is still held on the card. */
export const HELD_STATUSES = ['PENDING', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'DISPUTED'] as const

export const bookingInclude = {
  service: { select: { id: true, name: true, service: true } },
  package: { select: { id: true, name: true } },
  pro: { select: { id: true, name: true } },
} satisfies Prisma.BookingInclude

type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>

/**
 * Where the customer's money is. There's no payment provider yet, so this is derived
 * from the booking status + refunds rather than read from a real payment.
 */
export type PaymentState = 'HELD' | 'CHARGED' | 'RELEASED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

function paymentState(status: BookingRow['status'], total: number, refunded: number): PaymentState {
  if (refunded > 0) return refunded >= total ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
  if (status === 'CANCELLED') return 'RELEASED'
  if (status === 'COMPLETED') return 'CHARGED'
  return 'HELD'
}

export function toBookingDto(b: BookingRow) {
  const price = Number(b.price)
  const fee = Number(b.fee)
  const total = round2(price + fee)
  const refunded = Number(b.refundedAmount)
  return {
    id: b.id,
    code: b.code,
    status: b.status,
    service: b.service,
    package: b.package,
    pro: b.pro,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    customerEmail: b.customerEmail,
    address: b.address,
    district: b.district,
    propertyType: b.propertyType,
    notes: b.notes,
    date: b.date.toISOString().slice(0, 10),
    slot: b.slot,
    price,
    fee,
    total,
    refundedAmount: refunded,
    paymentState: paymentState(b.status, total, refunded),
    isPaidOut: b.payoutId !== null,
    createdAt: b.createdAt,
  }
}

/** "HC-48219" style public reference. */
export function randomBookingCode(): string {
  return 'HC-' + Math.floor(10000 + Math.random() * 90000)
}

/** Append a line to the booking's history (shown in the admin drawer). */
export function logEvent(tx: Prisma.TransactionClient, bookingId: number, message: string) {
  return tx.bookingEvent.create({ data: { bookingId, message } })
}
