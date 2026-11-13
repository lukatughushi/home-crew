import type { Request, Response } from 'express'
import type { BookingStatus, DisputeResolution } from '../../generated/prisma/client.js'
import { HttpError } from '../../lib/httpError.js'
import { returnToWallet } from '../../lib/wallet.js'
import { prisma } from '../../lib/prisma.js'
import { round2 } from '../../lib/time.js'
import { logEvent } from '../../models/booking.model.js'
import { disputeResolve, idParam } from '../../models/schemas.js'

const include = {
  booking: {
    include: {
      service: { select: { name: true } },
      package: { select: { name: true } },
      pro: { select: { id: true, name: true } },
    },
  },
} as const

export async function list(_req: Request, res: Response) {
  const [open, closed] = await Promise.all([
    prisma.dispute.findMany({ where: { resolvedAt: null }, include, orderBy: { deadline: 'asc' } }),
    prisma.dispute.findMany({ where: { resolvedAt: { not: null } }, include, orderBy: { resolvedAt: 'desc' }, take: 20 }),
  ])
  res.json(
    [...open, ...closed].map((d) => ({
      id: d.id,
      bookingId: d.bookingId,
      code: d.booking.code,
      service: d.booking.service.name,
      package: d.booking.package?.name ?? null,
      total: round2(Number(d.booking.price) + Number(d.booking.fee)),
      customerName: d.booking.customerName,
      pro: d.booking.pro,
      reason: d.reason,
      photos: d.photos,
      proReply: d.proReply,
      deadline: d.deadline,
      resolution: d.resolution,
      resolvedAt: d.resolvedAt,
      refundedAmount: Number(d.booking.refundedAmount),
    })),
  )
}

const OUTCOME: Record<DisputeResolution, { status: BookingStatus; refundShare: number; log: string }> = {
  REVISIT: { status: 'CONFIRMED', refundShare: 0, log: 'დავა: ხელახალი ვიზიტი დაინიშნა (უფასო)' },
  REFUND_HALF: { status: 'COMPLETED', refundShare: 0.5, log: 'დავა: 50% დაბრუნდა' },
  REFUND_FULL: { status: 'CANCELLED', refundShare: 1, log: 'დავა: თანხა სრულად დაბრუნდა' },
  REJECTED: { status: 'COMPLETED', refundShare: 0, log: 'დავა: საჩივარი უარყოფილია' },
}

export async function resolve(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const { resolution } = disputeResolve.parse(req.body)

  await prisma.$transaction(async (tx) => {
    const d = await tx.dispute.findUniqueOrThrow({ where: { id }, include: { booking: true } })
    if (d.resolvedAt) throw new HttpError(409, 'Dispute already resolved')

    const outcome = OUTCOME[resolution]
    const total = round2(Number(d.booking.price) + Number(d.booking.fee))
    const refund = round2(total * outcome.refundShare)

    await tx.dispute.update({ where: { id }, data: { resolution, resolvedAt: new Date() } })
    await tx.booking.update({
      where: { id: d.bookingId },
      data: { status: outcome.status, ...(refund > 0 && { refundedAmount: refund }) },
    })
    if (refund > 0) await returnToWallet(tx, d.bookingId, refund, `დავა · ${d.booking.code}`)
    await logEvent(tx, d.bookingId, refund > 0 ? `${outcome.log} · ${refund} ₾` : outcome.log)
  })
  res.status(204).end()
}
