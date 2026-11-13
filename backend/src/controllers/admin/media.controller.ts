import type { Request, Response } from 'express'
import { z } from 'zod'
import { HttpError } from '../../lib/httpError.js'
import { prisma } from '../../lib/prisma.js'
import { removeImage, saveImage } from '../../lib/uploads.js'

/** More slides than this just slows the homepage down. */
export const MAX_HERO_SLIDES = 10

const slideOrder = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }]

async function mediaState() {
  const [heroSlides, services] = await Promise.all([
    prisma.heroSlide.findMany({ orderBy: slideOrder, select: { id: true, url: true } }),
    prisma.service.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, photo: true, photoUrl: true, icon: true, isActive: true },
    }),
  ])
  return { heroSlides, maxHeroSlides: MAX_HERO_SLIDES, services }
}

/** GET /admin/media */
export async function list(_req: Request, res: Response) {
  res.json(await mediaState())
}

// ─── Homepage slider ──────────────────────────────────────────────

/** POST /admin/media/hero — adds a slide at the end; the image is the raw request body */
export async function addHeroSlide(req: Request, res: Response) {
  const count = await prisma.heroSlide.count()
  if (count >= MAX_HERO_SLIDES) throw new HttpError(409, `The slider can have at most ${MAX_HERO_SLIDES} photos`)
  const last = await prisma.heroSlide.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })
  const url = await saveImage(req.body)
  await prisma.heroSlide.create({ data: { url, sortOrder: (last?.sortOrder ?? -1) + 1 } })
  res.status(201).json(await mediaState())
}

/** DELETE /admin/media/hero/:id */
export async function removeHeroSlide(req: Request<{ id: string }>, res: Response) {
  const id = z.coerce.number().int().positive().parse(req.params.id)
  const slide = await prisma.heroSlide.delete({ where: { id } }) // P2025 → 404
  await removeImage(slide.url)
  res.json(await mediaState())
}

const orderInput = z.object({ ids: z.array(z.number().int().positive()).max(MAX_HERO_SLIDES) })

/** PUT /admin/media/hero/order — { ids } in the new display order (must list every slide) */
export async function reorderHeroSlides(req: Request, res: Response) {
  const { ids } = orderInput.parse(req.body)
  const existing = await prisma.heroSlide.findMany({ select: { id: true } })
  const same = ids.length === existing.length && new Set(ids).size === ids.length && existing.every((s) => ids.includes(s.id))
  if (!same) throw new HttpError(409, 'The slide list changed — reload the page and try again')

  await prisma.$transaction(ids.map((id, sortOrder) => prisma.heroSlide.update({ where: { id }, data: { sortOrder } })))
  res.json(await mediaState())
}

// ─── Service photos ───────────────────────────────────────────────

async function servicePhoto(id: string) {
  const service = await prisma.service.findUnique({ where: { id }, select: { photoUrl: true } })
  if (!service) throw new HttpError(404, 'Service not found')
  return service.photoUrl
}

/** PUT /admin/media/services/:id — the image is the raw request body */
export async function uploadServicePhoto(req: Request<{ id: string }>, res: Response) {
  const old = await servicePhoto(req.params.id)
  const url = await saveImage(req.body)
  await prisma.service.update({ where: { id: req.params.id }, data: { photoUrl: url } })
  await removeImage(old)
  res.json(await mediaState())
}

/** DELETE /admin/media/services/:id */
export async function removeServicePhoto(req: Request<{ id: string }>, res: Response) {
  const old = await servicePhoto(req.params.id)
  await prisma.service.update({ where: { id: req.params.id }, data: { photoUrl: '' } })
  await removeImage(old)
  res.json(await mediaState())
}

// ─── Public ───────────────────────────────────────────────────────

/** GET /site — public settings the website needs */
export async function publicSite(_req: Request, res: Response) {
  const slides = await prisma.heroSlide.findMany({ orderBy: slideOrder, select: { url: true } })
  res.json({ heroSlides: slides.map((s) => s.url) })
}
