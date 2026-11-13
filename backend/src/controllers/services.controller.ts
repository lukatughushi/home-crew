// Public (website) read-only endpoints.
import type { Request, Response } from 'express'
import { HttpError } from '../lib/httpError.js'
import { prisma } from '../lib/prisma.js'
import { initials, statsByPro } from '../models/pro.model.js'
import { ratingsByService, serviceInclude, toPublicServiceDto } from '../models/service.model.js'

export async function listServices(_req: Request, res: Response) {
  const [rows, ratings] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      include: serviceInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    ratingsByService(),
  ])
  res.json(rows.map((s) => toPublicServiceDto(s, ratings.get(s.id))))
}

export async function getService(req: Request<{ id: string }>, res: Response) {
  const row = await prisma.service.findFirst({
    where: { id: req.params.id, isActive: true },
    include: serviceInclude,
  })
  if (!row) throw new HttpError(404, 'Service not found')
  const ratings = await ratingsByService()
  res.json(toPublicServiceDto(row, ratings.get(row.id)))
}

/** Published testimonials for the homepage slider. */
export async function listPublishedReviews(_req: Request, res: Response) {
  const rows = await prisma.review.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
    select: { id: true, authorName: true, meta: true, quote: true, rating: true },
  })
  res.json(rows)
}

/** Approved, active pros offering this service — best rated first (service page + booking step 3). */
export async function listServicePros(req: Request<{ id: string }>, res: Response) {
  const [rows, stats] = await Promise.all([
    prisma.pro.findMany({
      where: { status: 'APPROVED', isActive: true, services: { some: { id: req.params.id, isActive: true } } },
      select: { id: true, name: true, tag: true, district: true, experienceYears: true },
    }),
    statsByPro(),
  ])
  const pros = rows.map((p) => {
    const s = stats.get(p.id)
    return { ...p, initials: initials(p.name), rating: s?.rating ?? null, reviews: s?.reviews ?? 0, jobs: s?.jobs ?? 0 }
  })
  pros.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.jobs - a.jobs)
  res.json(pros)
}
