// Weekly payouts to pros. There's no bank/payment integration yet:
// "გადარიცხვა" records that the transfer was made — the money itself moves outside the app.
import type { Request, Response } from 'express'
import type { Prisma } from '../../generated/prisma/client.js'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { addDays, dateOnly, round2, tbilisiDate } from '../../lib/time.js'
import { HELD_STATUSES } from '../../models/booking.model.js'
import { payoutCreate } from '../../models/schemas.js'

const unpaidWhere = {
  status: 'COMPLETED',
  payoutId: null,
  proId: { not: null },
} satisfies Prisma.BookingWhereInput

type UnpaidBooking = { id: number; proId: number | null; date: Date; price: Prisma.Decimal; refundedAmount: Prisma.Decimal; commissionPercent: Prisma.Decimal }

/** The pro earns the package price minus refunds; the platform keeps its commission + the booking fee. */
function totals(bookings: UnpaidBooking[]) {
  let gross = 0
  let commission = 0
  for (const b of bookings) {
    const earned = Math.max(0, Number(b.price) - Number(b.refundedAmount))
    gross += earned
    commission += (earned * Number(b.commissionPercent)) / 100
  }
  gross = round2(gross)
  commission = round2(commission)
  const dates = bookings.map((b) => b.date.getTime())
  return {
    jobs: bookings.length,
    gross,
    commission,
    net: round2(gross - commission),
    periodStart: new Date(Math.min(...dates)),
    periodEnd: new Date(Math.max(...dates)),
  }
}

const unpaidSelect = { id: true, proId: true, date: true, price: true, refundedAmount: true, commissionPercent: true } as const

export async function list(_req: Request, res: Response) {
  const weekAgo = dateOnly(addDays(tbilisiDate(), -6))

  const [unpaid, held, recentPaid, weekCompleted, pros] = await Promise.all([
    prisma.booking.findMany({ where: unpaidWhere, select: unpaidSelect }),
    prisma.booking.aggregate({
      where: { status: { in: [...HELD_STATUSES] } },
      _count: { _all: true },
      _sum: { price: true, fee: true },
    }),
    prisma.payout.findMany({
      where: { paidAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
      orderBy: { paidAt: 'desc' },
    }),
    prisma.booking.findMany({
      where: { status: 'COMPLETED', date: { gte: weekAgo } },
      select: unpaidSelect,
    }),
    prisma.pro.findMany({ select: { id: true, name: true } }),
  ])
  const proName = new Map(pros.map((p) => [p.id, p.name]))

  const byPro = new Map<number, UnpaidBooking[]>()
  for (const b of unpaid) byPro.set(b.proId!, [...(byPro.get(b.proId!) ?? []), b])

  const pending = [...byPro].map(([proId, bookings]) => ({
    proId,
    proName: proName.get(proId) ?? '—',
    ...totals(bookings),
    paidAt: null,
  }))
  const paid = recentPaid.map((p) => ({
    proId: p.proId,
    proName: proName.get(p.proId) ?? '—',
    jobs: p.jobs,
    gross: Number(p.gross),
    commission: Number(p.commission),
    net: Number(p.net),
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    paidAt: p.paidAt,
  }))

  const week = weekCompleted.length ? totals(weekCompleted) : null
  const rows = [...pending.sort((a, b) => b.net - a.net), ...paid]
  const allDates = rows.flatMap((r) => [r.periodStart.getTime(), r.periodEnd.getTime()])

  res.json({
    heldAmount: round2(Number(held._sum.price ?? 0) + Number(held._sum.fee ?? 0)),
    heldBookings: held._count._all,
    toPay: round2(pending.reduce((a, p) => a + p.net, 0)),
    toPayPros: pending.length,
    commissionWeek: week?.commission ?? 0,
    avgCommissionPercent: week && week.gross ? Math.round((week.commission / week.gross) * 100) : null,
    periodStart: allDates.length ? new Date(Math.min(...allDates)) : null,
    periodEnd: allDates.length ? new Date(Math.max(...allDates)) : null,
    rows,
  })
}

async function payPro(tx: Prisma.TransactionClient, proId: number) {
  const bookings = await tx.booking.findMany({ where: { ...unpaidWhere, proId }, select: unpaidSelect })
  if (!bookings.length) return null
  const t = totals(bookings)
  return tx.payout.create({
    data: {
      proId,
      jobs: t.jobs,
      gross: t.gross,
      commission: t.commission,
      net: t.net,
      periodStart: t.periodStart,
      periodEnd: t.periodEnd,
      bookings: { connect: bookings.map((b) => ({ id: b.id })) },
    },
  })
}

export async function create(req: Request, res: Response) {
  const { proId } = payoutCreate.parse(req.body)
  const payout = await prisma.$transaction((tx) => payPro(tx, proId))
  if (!payout) throw new HttpError(409, 'Nothing to pay for this pro')
  res.status(201).json({ id: payout.id, net: Number(payout.net) })
}

export async function createAll(_req: Request, res: Response) {
  const result = await prisma.$transaction(async (tx) => {
    const pros = await tx.booking.groupBy({ by: ['proId'], where: unpaidWhere })
    const made = []
    for (const p of pros) {
      const payout = await payPro(tx, p.proId!)
      if (payout) made.push(payout)
    }
    return made
  })
  res.status(201).json({ count: result.length, net: round2(result.reduce((a, p) => a + Number(p.net), 0)) })
}
