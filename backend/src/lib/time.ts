// All "today / this month" logic uses Tbilisi time, regardless of the server's timezone.
export const TIMEZONE = 'Asia/Tbilisi'

const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' })

/** "2026-11-06" for the given moment, in Tbilisi time. */
export function tbilisiDate(d: Date = new Date()): string {
  return ymd.format(d)
}

/** "2026-11-06" → Date at UTC midnight (how Prisma stores @db.Date values). */
export function dateOnly(isoDay: string): Date {
  return new Date(`${isoDay}T00:00:00.000Z`)
}

/** Shift an ISO day by n days. */
export function addDays(isoDay: string, n: number): string {
  const d = dateOnly(isoDay)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Start of the given Tbilisi day as a real instant (Tbilisi is UTC+4, no DST). */
export function startOfTbilisiDay(isoDay: string): Date {
  return new Date(`${isoDay}T00:00:00.000+04:00`)
}

export const round2 = (n: number) => Math.round(n * 100) / 100

/** Real instant a visit starts: day "2026-11-06" + slot "10–12" → 10:00 Tbilisi time. */
export function visitStart(isoDay: string, slot: string): Date {
  const hour = Number.parseInt(slot, 10)
  return new Date(startOfTbilisiDay(isoDay).getTime() + hour * 3_600_000)
}
