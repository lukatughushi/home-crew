import type { Request, Response } from 'express'
import { prisma } from '../../lib/prisma.js'
import { addDays, round2, startOfTbilisiDay, tbilisiDate } from '../../lib/time.js'
import { bookingInclude, toBookingDto } from '../../models/booking.model.js'

/** Counts for the sidebar badges — cheap enough to poll. */
export async function getBadges(_req: Request, res: Response) {
  const [pendingBookings, pendingPros, openDisputes, unpaidPros] = await Promise.all([
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.pro.count({ where: { status: 'PENDING' } }),
    prisma.dispute.count({ where: { resolvedAt: null } }),
    prisma.booking.groupBy({
      by: ['proId'],
      where: { status: 'COMPLETED', payoutId: null, proId: { not: null } },
    }),
  ])
  res.json({ pendingBookings, pendingPros, openDisputes, unpaidPros: unpaidPros.length })
}

function pctChange(now: number, before: number): number | null {
  if (before === 0) return null
  return Math.round(((now - before) / before) * 100)
}

export async function getStats(_req: Request, res: Response) {
  const today = tbilisiDate()
  const todayStart = startOfTbilisiDay(today)
  const yesterdayStart = startOfTbilisiDay(addDays(today, -1))
  const chartStart = startOfTbilisiDay(addDays(today, -13))
  const monthStart = startOfTbilisiDay(today.slice(0, 8) + '01')
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000)
  const notCancelled = { status: { not: 'CANCELLED' as const } }

  const [
    todayAgg,
    yesterdayAgg,
    activePros,
    onJob,
    ratingAll,
    ratingBefore30,
    pendingBookings,
    pendingPros,
    openDisputes,
    chartRows,
    monthRows,
    services,
    latest,
  ] = await Promise.all([
    prisma.booking.aggregate({
      where: { createdAt: { gte: todayStart }, ...notCancelled },
      _count: { _all: true },
      _sum: { price: true, fee: true },
    }),
    prisma.booking.aggregate({
      where: { createdAt: { gte: yesterdayStart, lt: todayStart }, ...notCancelled },
      _count: { _all: true },
      _sum: { price: true, fee: true },
    }),
    prisma.pro.count({ where: { status: 'APPROVED', isActive: true } }),
    prisma.booking.findMany({ where: { status: 'IN_PROGRESS' }, distinct: ['proId'], select: { proId: true } }),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.review.aggregate({ where: { createdAt: { lt: thirtyDaysAgo } }, _avg: { rating: true } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.pro.count({ where: { status: 'PENDING' } }),
    prisma.dispute.findMany({ where: { resolvedAt: null }, orderBy: { deadline: 'asc' }, select: { deadline: true } }),
    prisma.booking.findMany({ where: { createdAt: { gte: chartStart } }, select: { createdAt: true } }),
    prisma.booking.groupBy({ by: ['serviceId'], where: { createdAt: { gte: monthStart } }, _count: { _all: true } }),
    prisma.service.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: bookingInclude }),
  ])

  const revenue = (a: typeof todayAgg) => round2(Number(a._sum.price ?? 0) + Number(a._sum.fee ?? 0))

  // Bookings per day for the last 14 days (by creation day, Tbilisi time).
  const perDay = new Map<string, number>()
  for (let i = 13; i >= 0; i--) perDay.set(addDays(today, -i), 0)
  for (const r of chartRows) {
    const d = tbilisiDate(r.createdAt)
    if (perDay.has(d)) perDay.set(d, perDay.get(d)! + 1)
  }

  // Share of this month's bookings per category.
  const monthTotal = monthRows.reduce((a, r) => a + r._count._all, 0)
  const names = new Map(services.map((s) => [s.id, s.name]))
  const categorySplit = monthRows
    .map((r) => ({
      serviceId: r.serviceId,
      name: names.get(r.serviceId) ?? r.serviceId,
      count: r._count._all,
      percent: monthTotal ? Math.round((r._count._all / monthTotal) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  const avgAll = ratingAll._avg.rating
  const avgBefore = ratingBefore30._avg.rating

  res.json({
    today,
    bookingsToday: todayAgg._count._all,
    bookingsChange: pctChange(todayAgg._count._all, yesterdayAgg._count._all),
    revenueToday: revenue(todayAgg),
    revenueChange: pctChange(revenue(todayAgg), revenue(yesterdayAgg)),
    activePros,
    prosOnJob: onJob.length,
    avgRating: avgAll === null ? null : round2(avgAll),
    ratingChange30d: avgAll === null || avgBefore === null ? null : round2(avgAll - avgBefore),
    attention: {
      pendingBookings,
      pendingPros,
      openDisputes: openDisputes.length,
      nextDisputeDeadline: openDisputes[0]?.deadline ?? null,
    },
    chart: [...perDay].map(([date, count]) => ({ date, count })),
    categorySplit,
    latestBookings: latest.map(toBookingDto),
  })
}
