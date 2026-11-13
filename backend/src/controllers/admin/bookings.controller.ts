import type { Request, Response } from 'express'
import type { BookingStatus, Prisma } from '../../generated/prisma/client.js'
import { HttpError } from '../../lib/httpError.js'
import { returnToWallet } from '../../lib/wallet.js'
import { prisma } from '../../lib/prisma.js'
import { round2 } from '../../lib/time.js'
import { bookingInclude, logEvent, toBookingDto } from '../../models/booking.model.js'
import { statsByPro } from '../../models/pro.model.js'
import { bookingQuery, bookingUpdate, idParam } from '../../models/schemas.js'

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'ელოდება ხელოსანს',
  CONFIRMED: 'დადასტურებული',
  ON_THE_WAY: 'ხელოსანი გზაშია',
  IN_PROGRESS: 'მიმდინარე',
  COMPLETED: 'დასრულებული',
  CANCELLED: 'გაუქმებული',
  DISPUTED: 'დავა',
}

export async function list(req: Request, res: Response) {
  const { status, q, page, pageSize } = bookingQuery.parse(req.query)
  const search: Prisma.BookingWhereInput = q
    ? {
        OR: [
          { code: { contains: q, mode: 'insensitive' } },
          { customerName: { contains: q, mode: 'insensitive' } },
          { customerPhone: { contains: q } },
          { district: { contains: q, mode: 'insensitive' } },
          { pro: { name: { contains: q, mode: 'insensitive' } } },
          { service: { name: { contains: q, mode: 'insensitive' } } },
        ],
      }
    : {}
  const where: Prisma.BookingWhereInput = { ...search, ...(status && { status }) }

  const [rows, total, byStatus] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.booking.count({ where }),
    // Filter-chip counts follow the search box but ignore the status chip itself.
    prisma.booking.groupBy({ by: ['status'], where: search, _count: { _all: true } }),
  ])

  res.json({
    items: rows.map(toBookingDto),
    total,
    page,
    pageSize,
    counts: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
  })
}

/** Booking + history + the pros who can be assigned to it. */
export async function get(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const row = await prisma.booking.findUniqueOrThrow({
    where: { id },
    include: { ...bookingInclude, events: { orderBy: { createdAt: 'asc' } } },
  })
  const [eligible, stats] = await Promise.all([
    prisma.pro.findMany({
      where: { status: 'APPROVED', isActive: true, services: { some: { id: row.serviceId } } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    statsByPro(),
  ])
  res.json({
    ...toBookingDto(row),
    events: row.events.map((e) => ({ id: e.id, message: e.message, createdAt: e.createdAt })),
    eligiblePros: eligible
      .map((p) => ({ ...p, rating: stats.get(p.id)?.rating ?? null }))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
  })
}

/** Assign / unassign a pro and/or change the status. */
export async function update(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const input = bookingUpdate.parse(req.body)

  const row = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findUniqueOrThrow({ where: { id } })
    if (b.status === 'CANCELLED') throw new HttpError(409, 'Booking is cancelled')

    const data: Prisma.BookingUncheckedUpdateInput = {}
    let status = input.status ?? b.status

    if (input.proId !== undefined) {
      if (input.proId === null) {
        data.proId = null
        await logEvent(tx, id, 'ხელოსანი მოიხსნა')
        if (!input.status && status === 'CONFIRMED') status = 'PENDING'
      } else {
        const pro = await tx.pro.findFirst({
          where: { id: input.proId, status: 'APPROVED', isActive: true, services: { some: { id: b.serviceId } } },
        })
        if (!pro) throw new HttpError(400, 'This pro is inactive or does not offer this service')
        data.proId = pro.id
        await logEvent(tx, id, `მიენიჭა: ${pro.name}`)
        if (!input.status && status === 'PENDING') status = 'CONFIRMED'
      }
    }

    if (status !== b.status) {
      if (status === 'CANCELLED') throw new HttpError(400, 'Use the cancel endpoint')
      data.status = status
      await logEvent(tx, id, `სტატუსი: ${STATUS_LABEL[status]}`)
    }

    return tx.booking.update({ where: { id }, data, include: bookingInclude })
  })
  res.json(toBookingDto(row))
}

/** Cancel: the held amount is released back to the customer. */
export async function cancel(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const row = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findUniqueOrThrow({ where: { id } })
    if (b.status === 'CANCELLED') throw new HttpError(409, 'Already cancelled')
    if (b.status === 'COMPLETED') throw new HttpError(409, 'Completed bookings can only be refunded')
    const back = await returnToWallet(tx, id, round2(Number(b.price) + Number(b.fee)), `გაუქმება · ${b.code}`)
    await logEvent(tx, id, `ჯავშანი გაუქმდა · დაბლოკილი თანხა გათავისუფლდა${back ? ` · ${back} ₾ დაბრუნდა ბალანსზე` : ''}`)
    return tx.booking.update({ where: { id }, data: { status: 'CANCELLED' }, include: bookingInclude })
  })
  res.json(toBookingDto(row))
}

/** Full refund to the customer; the booking ends up cancelled. */
export async function refund(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const row = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findUniqueOrThrow({ where: { id } })
    const total = round2(Number(b.price) + Number(b.fee))
    if (Number(b.refundedAmount) >= total) throw new HttpError(409, 'Already refunded')
    await returnToWallet(tx, id, total, `თანხის დაბრუნება · ${b.code}`)
    await logEvent(tx, id, `თანხა დაბრუნდა · ${total} ₾`)
    return tx.booking.update({
      where: { id },
      data: { status: 'CANCELLED', refundedAmount: total },
      include: bookingInclude,
    })
  })
  res.json(toBookingDto(row))
}
