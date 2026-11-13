// Test wallet: bookings are paid from the customer's balance until a real payment provider is connected.
// Every balance change is also written to WalletTransaction, which is how we know what was already returned.
import type { Prisma } from '../generated/prisma/client.js'
import { HttpError } from './httpError.js'
import { round2 } from './time.js'

type Tx = Prisma.TransactionClient

/** Money given to every new account so bookings can be tested. */
export const SIGNUP_TEST_BALANCE = 1000
/** "Add test money" button on the account page (disabled in production). */
export const TEST_TOPUP_AMOUNT = 500
export const MAX_TEST_BALANCE = 5000

export async function addTestMoney(tx: Tx, customerId: number, amount: number, note: string) {
  await tx.customer.update({ where: { id: customerId }, data: { balance: { increment: amount } } })
  await tx.walletTransaction.create({ data: { customerId, type: 'TOPUP', amount, note } })
}

/** Takes the booking total from the balance, or fails with 402 if there isn't enough. */
export async function payBooking(tx: Tx, customerId: number, bookingId: number, amount: number, note: string) {
  // Conditional update = no race between "check balance" and "take money".
  const { count } = await tx.customer.updateMany({
    where: { id: customerId, balance: { gte: amount } },
    data: { balance: { decrement: amount } },
  })
  if (count === 0) throw new HttpError(402, 'Not enough balance')
  await tx.walletTransaction.create({ data: { customerId, bookingId, type: 'PAYMENT', amount: -amount, note } })
}

/**
 * Makes sure `target` (in total) has been returned to the customer for this booking.
 * Only the part not returned yet is credited, so cancel → refund → dispute can never pay out twice.
 * Bookings without an account (old/demo data) are skipped.
 */
export async function returnToWallet(tx: Tx, bookingId: number, target: number, note: string) {
  const b = await tx.booking.findUniqueOrThrow({ where: { id: bookingId }, select: { customerId: true } })
  if (!b.customerId) return 0

  const paid = await tx.walletTransaction.aggregate({ where: { bookingId, type: 'PAYMENT' }, _sum: { amount: true } })
  if (!paid._sum.amount) return 0 // nothing was paid from the wallet
  const returned = await tx.walletTransaction.aggregate({ where: { bookingId, type: 'REFUND' }, _sum: { amount: true } })

  const maxBack = -Number(paid._sum.amount)
  const credit = round2(Math.min(target, maxBack) - Number(returned._sum.amount ?? 0))
  if (credit <= 0) return 0

  await tx.customer.update({ where: { id: b.customerId }, data: { balance: { increment: credit } } })
  await tx.walletTransaction.create({ data: { customerId: b.customerId, bookingId, type: 'REFUND', amount: credit, note } })
  return credit
}
