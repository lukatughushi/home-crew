import type { Request, Response } from 'express'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { serviceInput, servicesBulkUpdate, serviceUpdate } from '../../models/schemas.js'
import { ratingsByService, serviceInclude, toServiceDto } from '../../models/service.model.js'

type Params = { id: string }

async function listDtos() {
  const [rows, ratings] = await Promise.all([
    prisma.service.findMany({ include: serviceInclude, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }),
    ratingsByService(),
  ])
  return rows.map((s) => toServiceDto(s, ratings.get(s.id)))
}

export async function list(_req: Request, res: Response) {
  res.json(await listDtos())
}

export async function get(req: Request<Params>, res: Response) {
  const row = await prisma.service.findUniqueOrThrow({ where: { id: req.params.id }, include: serviceInclude })
  const ratings = await ratingsByService()
  res.json(toServiceDto(row, ratings.get(row.id)))
}

/**
 * "სერვისები და ფასები" save bar: starting price, commission and on/off for several services at once.
 * Existing bookings keep the price/commission they were created with.
 */
export async function bulkUpdate(req: Request, res: Response) {
  const rows = servicesBulkUpdate.parse(req.body)
  await prisma.$transaction(
    rows.map(({ id, ...data }) => prisma.service.update({ where: { id }, data })),
  )
  res.json(await listDtos())
}

export async function create(req: Request, res: Response) {
  const { packages, ...data } = serviceInput.parse(req.body)
  const row = await prisma.service.create({
    data: { ...data, packages: { create: packages.map(({ id: _id, ...p }) => p) } },
    include: serviceInclude,
  })
  res.status(201).json(toServiceDto(row))
}

/** Replaces the service fields and syncs its package list (update / create / delete). */
export async function update(req: Request<Params>, res: Response) {
  const { packages, ...data } = serviceUpdate.parse(req.body)
  const serviceId = req.params.id

  const row = await prisma.$transaction(async (tx) => {
    await tx.service.update({ where: { id: serviceId }, data })

    const existing = await tx.package.findMany({ where: { serviceId }, select: { id: true } })
    const existingIds = new Set(existing.map((p) => p.id))
    const keptIds = packages.flatMap((p) => (p.id ? [p.id] : []))
    const foreign = keptIds.find((id) => !existingIds.has(id))
    if (foreign) throw new HttpError(400, `Package ${foreign} does not belong to this service`)

    // Bookings keep their price snapshot; their packageId becomes null (onDelete: SetNull).
    await tx.package.deleteMany({ where: { serviceId, id: { notIn: keptIds } } })
    for (const { id, ...p } of packages) {
      if (id) await tx.package.update({ where: { id }, data: p })
      else await tx.package.create({ data: { ...p, serviceId } })
    }
    return tx.service.findUniqueOrThrow({ where: { id: serviceId }, include: serviceInclude })
  })

  const ratings = await ratingsByService()
  res.json(toServiceDto(row, ratings.get(row.id)))
}

/** Services with bookings can't be deleted (history would break) — deactivate them instead. */
export async function remove(req: Request<Params>, res: Response) {
  const bookings = await prisma.booking.count({ where: { serviceId: req.params.id } })
  if (bookings > 0) {
    throw new HttpError(409, `Service has ${bookings} booking(s); set isActive=false to hide it instead`)
  }
  await prisma.service.delete({ where: { id: req.params.id } })
  res.status(204).end()
}
