import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { aggregate, type RatingStats } from './service.model.js'

export const proInclude = {
  services: { select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } },
  documents: { orderBy: { id: 'asc' } },
} satisfies Prisma.ProInclude

type ProRow = Prisma.ProGetPayload<{ include: typeof proInclude }>

export interface ProStats extends RatingStats {
  /** Completed bookings */
  jobs: number
  /** Share of this pro's bookings that ended cancelled, 0–100 */
  cancelRate: number
}

export async function statsByPro(): Promise<Map<number, ProStats>> {
  const [reviews, counts] = await Promise.all([
    prisma.review.findMany({
      where: { booking: { proId: { not: null } } },
      select: { rating: true, booking: { select: { proId: true } } },
    }),
    prisma.booking.groupBy({ by: ['proId', 'status'], where: { proId: { not: null } }, _count: { _all: true } }),
  ])
  const ratings = aggregate(reviews.map((r) => [r.booking!.proId!, r.rating]))

  const totals = new Map<number, { all: number; done: number; cancelled: number }>()
  for (const c of counts) {
    const t = totals.get(c.proId!) ?? { all: 0, done: 0, cancelled: 0 }
    t.all += c._count._all
    if (c.status === 'COMPLETED') t.done += c._count._all
    if (c.status === 'CANCELLED') t.cancelled += c._count._all
    totals.set(c.proId!, t)
  }

  const out = new Map<number, ProStats>()
  const ids = new Set([...ratings.keys(), ...totals.keys()])
  for (const id of ids) {
    const t = totals.get(id) ?? { all: 0, done: 0, cancelled: 0 }
    const r = ratings.get(id)
    out.set(id, {
      rating: r?.rating ?? null,
      reviews: r?.reviews ?? 0,
      jobs: t.done,
      cancelRate: t.all ? Math.round((t.cancelled / t.all) * 100) : 0,
    })
  }
  return out
}

/** "მარიამ ბერიძე" → "მბ" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

export function toProDto(p: ProRow, stats?: ProStats) {
  return {
    id: p.id,
    name: p.name,
    initials: initials(p.name),
    phone: p.phone,
    email: p.email,
    district: p.district,
    experienceYears: p.experienceYears,
    tag: p.tag,
    status: p.status,
    isActive: p.isActive,
    services: p.services,
    documents: p.documents.map((d) => ({ id: d.id, name: d.name, isVerified: d.isVerified })),
    docsRequestedAt: p.docsRequestedAt,
    createdAt: p.createdAt,
    jobs: stats?.jobs ?? 0,
    cancelRate: stats?.cancelRate ?? 0,
    rating: stats?.rating ?? null,
    reviews: stats?.reviews ?? 0,
  }
}
