// Website booking: the logged-in customer books a package and pays from their (test) balance.
import type { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client.js'
import { HttpError } from '../lib/httpError.js'
import { prisma } from '../lib/prisma.js'
import { addDays, dateOnly, round2, tbilisiDate, visitStart } from '../lib/time.js'
import { payBooking } from '../lib/wallet.js'
import { BOOKING_FEE, bookingInclude, logEvent, randomBookingCode, toBookingDto } from '../models/booking.model.js'
import { bookingCreate } from '../models/schemas.js'

/** How far ahead the website lets you book (today + 13 days). */
export const BOOKING_DAYS = 14
/** A slot can be booked until 1 hour before it starts. */
const MIN_LEAD_MS = 60 * 60 * 1000

export async function createBooking(req: Request, res: Response) {
  const customer = req.customer! // requireCustomer runs first
  const input = bookingCreate.parse(req.body)

  const today = tbilisiDate()
  if (input.date < today || input.date > addDays(today, BOOKING_DAYS - 1)) {
    throw new HttpError(400, 'Pick a day within the next two weeks')
  }
  if (visitStart(input.date, input.slot).getTime() < Date.now() + MIN_LEAD_MS) {
    throw new HttpError(400, 'This time slot is no longer available')
  }

  const pkg = await prisma.package.findFirst({
    where: { id: input.packageId, serviceId: input.serviceId, service: { isActive: true } },
    include: { service: { select: { commissionPercent: true, service: true } } },
  })
  if (!pkg) throw new HttpError(400, 'Unknown service or package')

  if (input.proId) {
    const pro = await prisma.pro.findFirst({
      where: { id: input.proId, status: 'APPROVED', isActive: true, services: { some: { id: input.serviceId } } },
    })
    if (!pro) throw new HttpError(400, 'This pro does not offer this service')
  }

  const total = round2(Number(pkg.price) + BOOKING_FEE)

  // Retry a few times in the unlikely case the random code already exists.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const booking = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.create({
          data: {
            code: randomBookingCode(),
            status: input.proId ? 'CONFIRMED' : 'PENDING',
            serviceId: input.serviceId,
            packageId: pkg.id,
            proId: input.proId ?? null,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: input.phone,
            customerEmail: customer.email,
            address: input.address,
            district: input.district,
            propertyType: input.propertyType,
            notes: input.notes,
            date: dateOnly(input.date),
            slot: input.slot,
            price: pkg.price,
            fee: BOOKING_FEE,
            commissionPercent: pkg.service.commissionPercent,
          },
          include: bookingInclude,
        })
        await payBooking(tx, customer.id, b.id, total, `${pkg.service.service} · ${b.code}`)
        await logEvent(tx, b.id, `ჯავშანი შეიქმნა · ვებ · ${total} ₾ დაბლოკილია ბალანსზე`)
        if (b.pro) await logEvent(tx, b.id, `მიენიჭა: ${b.pro.name}`)
        if (!customer.phone) await tx.customer.update({ where: { id: customer.id }, data: { phone: input.phone } })
        return b
      })
      res.status(201).json(toBookingDto(booking))
      return
    } catch (err) {
      const codeTaken =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        JSON.stringify(err.meta ?? {}).includes('code')
      if (!codeTaken) throw err
    }
  }
  throw new HttpError(500, 'Could not generate a booking code')
}
