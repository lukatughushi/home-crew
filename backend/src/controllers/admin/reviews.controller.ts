import type { Request, Response } from 'express'
import { prisma } from '../../lib/prisma.js'
import { idParam, reviewInput } from '../../models/schemas.js'

const include = { booking: { select: { id: true, code: true } } } as const

export async function list(_req: Request, res: Response) {
  res.json(await prisma.review.findMany({ include, orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }] }))
}

export async function create(req: Request, res: Response) {
  const data = reviewInput.parse(req.body)
  res.status(201).json(await prisma.review.create({ data, include }))
}

export async function update(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  const data = reviewInput.parse(req.body)
  res.json(await prisma.review.update({ where: { id }, data, include }))
}

export async function remove(req: Request, res: Response) {
  const { id } = idParam.parse(req.params)
  await prisma.review.delete({ where: { id } })
  res.status(204).end()
}
