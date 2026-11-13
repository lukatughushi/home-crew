import type { Request, Response } from 'express'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { proInclude, statsByPro, toProDto } from '../../models/pro.model.js'
import { idParam, proDocParams, proDocPatch, proInput, proPatch, proQuery } from '../../models/schemas.js'

async function assertServicesExist(ids: string[]) {
  if (!ids.length) return
  const found = await prisma.service.count({ where: { id: { in: ids } } })
  if (found !== new Set(ids).size) throw new HttpError(400, 'Unknown service id in serviceIds')
}

async function respondWithPro(res: Response, id: number, status = 200) {
  const [row, stats] = await Promise.all([
    prisma.pro.findUniqueOrThrow({ where: { id }, include: proInclude }),
    statsByPro(),
  ])
  res.status(status).json(toProDto(row, stats.get(id)))
}

/** ?status=PENDING → verification queue (oldest first); otherwise all pros by name. */
export async function list(req: Request, res: Response) {
  const { status } = proQuery.parse(req.query)
  const [rows, stats] = await Promise.all([
    prisma.pro.findMany({
      where: status ? { status } : {},
      include: proInclude,
      orderBy: status === 'PENDING' ? { createdAt: 'asc' } : { name: 'asc' },
    }),
    statsByPro(),
  ])
  res.json(rows.map((p) => toProDto(p, stats.get(p.id))))
}

export async function get(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  await respondWithPro(res, id)
}

/** Admin adds a pro directly (already verified). */
export async function create(req: Request, res: Response) {
  const { serviceIds, ...data } = proInput.parse(req.body)
  await assertServicesExist(serviceIds)
  const row = await prisma.pro.create({
    data: { ...data, status: 'APPROVED', services: { connect: serviceIds.map((id) => ({ id })) } },
  })
  await respondWithPro(res, row.id, 201)
}

export async function update(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const { serviceIds, ...data } = proInput.parse(req.body)
  await assertServicesExist(serviceIds)
  await prisma.pro.update({
    where: { id },
    data: { ...data, services: { set: serviceIds.map((sid) => ({ id: sid })) } },
  })
  await respondWithPro(res, id)
}

/** "აქტიური" switch in the pros table. */
export async function patch(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const { isActive } = proPatch.parse(req.body)
  await prisma.pro.update({ where: { id }, data: { isActive } })
  await respondWithPro(res, id)
}

/** Mark one application document as checked / missing. */
export async function setDocument(req: Request, res: Response) {
  const { id, docId } = proDocParams.parse(req.params)
  const { isVerified } = proDocPatch.parse(req.body)
  const { count } = await prisma.proDocument.updateMany({ where: { id: docId, proId: id }, data: { isVerified } })
  if (!count) throw new HttpError(404, 'Document not found')
  await respondWithPro(res, id)
}

export async function approve(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const pro = await prisma.pro.findUniqueOrThrow({ where: { id }, include: { documents: true } })
  if (pro.status !== 'PENDING') throw new HttpError(409, 'Application already decided')
  if (pro.documents.some((d) => !d.isVerified)) throw new HttpError(409, 'Not all documents are verified')
  await prisma.pro.update({ where: { id }, data: { status: 'APPROVED', isActive: true } })
  await respondWithPro(res, id)
}

export async function reject(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const pro = await prisma.pro.findUniqueOrThrow({ where: { id } })
  if (pro.status !== 'PENDING') throw new HttpError(409, 'Application already decided')
  await prisma.pro.update({ where: { id }, data: { status: 'REJECTED', isActive: false } })
  await respondWithPro(res, id)
}

/**
 * Records that missing documents were requested.
 * NOTE: no email/SMS is sent yet — there is no messaging integration.
 */
export async function requestDocs(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  await prisma.pro.update({ where: { id }, data: { docsRequestedAt: new Date() } })
  await respondWithPro(res, id)
}

/** Pros with bookings can't be deleted — deactivate them instead. */
export async function remove(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const bookings = await prisma.booking.count({ where: { proId: id } })
  if (bookings > 0) throw new HttpError(409, `Pro has ${bookings} booking(s); deactivate instead`)
  await prisma.pro.delete({ where: { id } })
  res.status(204).end()
}
