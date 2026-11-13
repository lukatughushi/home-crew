// Website customer accounts: sign-up / login, own bookings, test wallet and profile.
import bcrypt from 'bcryptjs'
import type { Request, Response } from 'express'
import { env } from '../config/env.js'
import { CUSTOMER_COOKIE, customerCookieOptions, signCustomerToken } from '../lib/auth.js'
import { HttpError } from '../lib/httpError.js'
import { prisma } from '../lib/prisma.js'
import { round2, visitStart } from '../lib/time.js'
import { addTestMoney, MAX_TEST_BALANCE, returnToWallet, SIGNUP_TEST_BALANCE, TEST_TOPUP_AMOUNT } from '../lib/wallet.js'
import { resetLoginAttempts } from '../middleware/loginLimiter.js'
import { customerSelect } from '../middleware/customerAuth.js'
import { initials } from '../models/pro.model.js'
import { customerReviewInput, idParam, loginInput, profileUpdate, registerInput } from '../models/schemas.js'

// Compared against when the email doesn't exist, so response time doesn't reveal which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12)

/** Free cancellation until this long before the visit (as promised on the service page). */
const FREE_CANCEL_MS = 24 * 60 * 60 * 1000

type CustomerRow = NonNullable<Request['customer']>

function toMeDto(c: CustomerRow) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    initials: initials(c.name),
    balance: Number(c.balance),
    createdAt: c.createdAt,
    canTopUp: env.testWallet,
  }
}

function startSession(res: Response, customerId: number) {
  res.cookie(CUSTOMER_COOKIE, signCustomerToken(customerId), customerCookieOptions)
}

/** POST /account/register */
export async function register(req: Request, res: Response) {
  const input = registerInput.parse(req.body)
  if (await prisma.customer.findUnique({ where: { email: input.email } })) {
    throw new HttpError(409, 'An account with this email already exists')
  }
  const passwordHash = await bcrypt.hash(input.password, 12)
  const customer = await prisma.$transaction(async (tx) => {
    const c = await tx.customer.create({
      data: { name: input.name, email: input.email, phone: input.phone, passwordHash, lastLoginAt: new Date() },
    })
    await addTestMoney(tx, c.id, SIGNUP_TEST_BALANCE, 'სატესტო თანხა რეგისტრაციისას')
    return tx.customer.findUniqueOrThrow({ where: { id: c.id }, select: customerSelect })
  })
  resetLoginAttempts(req)
  startSession(res, customer.id)
  res.status(201).json(toMeDto(customer))
}

/** POST /account/login */
export async function login(req: Request, res: Response) {
  const { email, password } = loginInput.parse(req.body)
  const found = await prisma.customer.findUnique({ where: { email } })
  const ok = await bcrypt.compare(password, found?.passwordHash ?? DUMMY_HASH)
  if (!found || !ok) throw new HttpError(401, 'Wrong email or password')

  resetLoginAttempts(req)
  const customer = await prisma.customer.update({
    where: { id: found.id },
    data: { lastLoginAt: new Date() },
    select: customerSelect,
  })
  startSession(res, customer.id)
  res.json(toMeDto(customer))
}

/** POST /account/logout */
export function logout(_req: Request, res: Response) {
  const { maxAge: _maxAge, ...opts } = customerCookieOptions
  res.clearCookie(CUSTOMER_COOKIE, opts)
  res.status(204).end()
}

/** GET /account/me — null (not 401) when logged out, so the site can just check it. */
export function me(req: Request, res: Response) {
  res.json(req.customer ? toMeDto(req.customer) : null)
}

/** PATCH /account/me */
export async function updateMe(req: Request, res: Response) {
  const input = profileUpdate.parse(req.body)
  const customer = await prisma.customer.update({ where: { id: req.customer!.id }, data: input, select: customerSelect })
  res.json(toMeDto(customer))
}

// ─── Bookings ─────────────────────────────────────────────────────

const myBookingInclude = {
  service: { select: { id: true, name: true, service: true, icon: true } },
  package: { select: { id: true, name: true } },
  pro: { select: { id: true, name: true } },
  review: { select: { rating: true } },
} as const

async function findMyBooking(req: Request) {
  const { id } = idParam.parse(req.params)
  const b = await prisma.booking.findFirst({ where: { id, customerId: req.customer!.id }, include: myBookingInclude })
  if (!b) throw new HttpError(404, 'Booking not found')
  return b
}

type MyBooking = Awaited<ReturnType<typeof findMyBooking>>

function cancelState(b: MyBooking): { canCancel: boolean; cancelNote: string } {
  if (!['PENDING', 'CONFIRMED'].includes(b.status)) return { canCancel: false, cancelNote: '' }
  // No pro yet → nobody is inconvenienced, cancel any time. Otherwise: free until 24 h before.
  if (b.status === 'PENDING') return { canCancel: true, cancelNote: '' }
  const day = b.date.toISOString().slice(0, 10)
  const ok = visitStart(day, b.slot).getTime() - Date.now() > FREE_CANCEL_MS
  return { canCancel: ok, cancelNote: ok ? '' : 'ვიზიტამდე 24 სთ-ზე ნაკლებია — გასაუქმებლად დაგვიკავშირდი' }
}

function toMyBookingDto(b: MyBooking) {
  const total = round2(Number(b.price) + Number(b.fee))
  const day = b.date.toISOString().slice(0, 10)
  const upcoming = ['PENDING', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS'].includes(b.status)
  return {
    id: b.id,
    code: b.code,
    status: b.status,
    service: b.service,
    package: b.package,
    pro: b.pro && { ...b.pro, initials: initials(b.pro.name) },
    address: b.address,
    date: day,
    slot: b.slot,
    total,
    refundedAmount: Number(b.refundedAmount),
    upcoming,
    rating: b.review?.rating ?? null,
    canReview: b.status === 'COMPLETED' && !b.review,
    ...cancelState(b),
    createdAt: b.createdAt,
  }
}

/** GET /account/bookings */
export async function myBookings(req: Request, res: Response) {
  const rows = await prisma.booking.findMany({
    where: { customerId: req.customer!.id },
    include: myBookingInclude,
    orderBy: [{ date: 'desc' }, { slot: 'desc' }],
  })
  res.json(rows.map(toMyBookingDto))
}

/** POST /account/bookings/:id/cancel — full amount goes back to the balance */
export async function cancelMyBooking(req: Request, res: Response) {
  const b = await findMyBooking(req)
  const { canCancel } = cancelState(b)
  if (!canCancel) throw new HttpError(409, 'This booking can no longer be cancelled online')

  const total = round2(Number(b.price) + Number(b.fee))
  await prisma.$transaction(async (tx) => {
    // Guard against a double click / admin changing it at the same moment.
    const { count } = await tx.booking.updateMany({
      where: { id: b.id, status: { in: ['PENDING', 'CONFIRMED'] } },
      data: { status: 'CANCELLED' },
    })
    if (count === 0) throw new HttpError(409, 'Booking status changed — reload the page')
    const back = await returnToWallet(tx, b.id, total, `გაუქმება · ${b.code}`)
    await tx.bookingEvent.create({ data: { bookingId: b.id, message: `მომხმარებელმა გააუქმა · ${back} ₾ დაბრუნდა ბალანსზე` } })
  })
  res.json(toMyBookingDto(await findMyBooking(req)))
}

/** POST /account/bookings/:id/review */
export async function reviewMyBooking(req: Request, res: Response) {
  const b = await findMyBooking(req)
  if (b.status !== 'COMPLETED') throw new HttpError(409, 'Only completed jobs can be rated')
  if (b.review) throw new HttpError(409, 'Already rated')

  const { rating, quote } = customerReviewInput.parse(req.body)
  const [first, last] = req.customer!.name.split(/\s+/)
  await prisma.review.create({
    data: {
      bookingId: b.id,
      authorName: last ? `${first} ${last[0]}.` : first, // "ნინო ბ."
      meta: [b.service.name, b.package?.name].filter(Boolean).join(' · '),
      quote,
      rating,
      isPublished: false, // admin decides what goes on the homepage
    },
  })
  res.status(201).json(toMyBookingDto(await findMyBooking(req)))
}

// ─── Wallet ───────────────────────────────────────────────────────

/** GET /account/transactions */
export async function myTransactions(req: Request, res: Response) {
  const rows = await prisma.walletTransaction.findMany({
    where: { customerId: req.customer!.id },
    orderBy: { id: 'desc' },
    take: 100,
    select: { id: true, type: true, amount: true, note: true, createdAt: true, booking: { select: { code: true } } },
  })
  res.json(rows.map((t) => ({ ...t, amount: Number(t.amount), booking: undefined, bookingCode: t.booking?.code ?? null })))
}

/** POST /account/wallet/topup — test money; off in production */
export async function topUp(req: Request, res: Response) {
  if (!env.testWallet) throw new HttpError(403, 'Test money is disabled')
  const c = req.customer!
  if (Number(c.balance) + TEST_TOPUP_AMOUNT > MAX_TEST_BALANCE) {
    throw new HttpError(409, `Test balance is limited to ${MAX_TEST_BALANCE} ₾`)
  }
  const customer = await prisma.$transaction(async (tx) => {
    await addTestMoney(tx, c.id, TEST_TOPUP_AMOUNT, 'სატესტო თანხის დამატება')
    return tx.customer.findUniqueOrThrow({ where: { id: c.id }, select: customerSelect })
  })
  res.json(toMeDto(customer))
}
