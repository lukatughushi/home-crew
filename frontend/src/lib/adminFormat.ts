// Georgian labels, colours and date helpers for the admin panel.
import type { BookingStatus, DisputeResolution, PaymentState } from '@/types/admin'

/** [label, background, text] — colours from the admin design */
export const STATUS: Record<BookingStatus, [string, string, string]> = {
  PENDING: ['ელოდება ხელოსანს', '#FFF7E6', '#92400E'],
  CONFIRMED: ['დადასტურებული', '#EAF0F8', '#1A3358'],
  ON_THE_WAY: ['გზაშია', '#E0F2FE', '#075985'],
  IN_PROGRESS: ['მიმდინარე', '#E0F2FE', '#075985'],
  COMPLETED: ['დასრულებული', '#E7F6EF', '#047857'],
  CANCELLED: ['გაუქმებული', '#F1F3F6', '#5A6A80'],
  DISPUTED: ['დავა', '#FEF2F2', '#B42318'],
}

export const PAYMENT: Record<PaymentState, string> = {
  HELD: 'დაბლოკილია',
  CHARGED: 'ჩამოჭრილია',
  RELEASED: 'გათავისუფლდა',
  REFUNDED: 'დაბრუნებულია',
  PARTIALLY_REFUNDED: 'ნაწილობრივ დაბრუნდა',
}

export const RESOLUTION: Record<DisputeResolution, string> = {
  REVISIT: 'ხელახალი ვიზიტი დაინიშნა',
  REFUND_HALF: '50% დაბრუნდა',
  REFUND_FULL: 'სრულად დაბრუნდა',
  REJECTED: 'საჩივარი უარყოფილია',
}

const MONTHS = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი']
const MONTHS_SHORT = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოემ', 'დეკ']
const WEEKDAYS = ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი']

const TZ = 'Asia/Tbilisi'
const ymdFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const hmFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })

/** YYYY-MM-DD in Tbilisi time */
export const tbilisiDay = (d: Date = new Date()) => ymdFmt.format(d)

function shiftDay(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** "2026-11-06" → "6 ნოემ" */
export function shortDate(iso: string) {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]}`
}

function relativeDay(iso: string): string {
  const today = tbilisiDay()
  if (iso === today) return 'დღეს'
  if (iso === shiftDay(today, 1)) return 'ხვალ'
  if (iso === shiftDay(today, -1)) return 'გუშინ'
  return shortDate(iso)
}

/** Booking visit: "დღეს 14:00", "ხვალ 08:00", "5 ნოემ 10:00" */
export function visitLabel(date: string, slot: string) {
  return `${relativeDay(date)} ${slot.split('–')[0]}:00`
}

/** Moment in time: "დღეს 09:12" */
export function momentLabel(at: string | Date) {
  const d = new Date(at)
  return `${relativeDay(tbilisiDay(d))} ${hmFmt.format(d)}`
}

/** "2 სთ წინ", "გუშინ", "5 ნოემ" */
export function agoLabel(at: string) {
  const mins = Math.round((Date.now() - new Date(at).getTime()) / 60_000)
  if (mins < 60) return `${Math.max(1, mins)} წთ წინ`
  if (mins < 24 * 60) return `${Math.round(mins / 60)} სთ წინ`
  return relativeDay(tbilisiDay(new Date(at)))
}

/** Dispute SLA: "21 სთ დარჩა" / "ვადა გადაცილებულია" */
export function slaLabel(deadline: string) {
  const hours = (new Date(deadline).getTime() - Date.now()) / 3_600_000
  if (hours <= 0) return 'ვადა გადაცილებულია'
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} წთ დარჩა`
  return `${Math.floor(hours)} სთ დარჩა`
}

/** "პარასკევი, 6 ნოემბერი" */
export function longToday() {
  const [y, m, d] = tbilisiDay().split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${WEEKDAYS[weekday]}, ${d} ${MONTHS[m - 1]}`
}

export const monthName = (iso: string) => MONTHS[Number(iso.slice(5, 7)) - 1]

/** "28 ოქტ – 3 ნოემ" */
export function periodLabel(start: string, end: string) {
  const a = shortDate(start.slice(0, 10))
  const b = shortDate(end.slice(0, 10))
  return a === b ? a : `${a} – ${b}`
}

/** "▲ 8%" / "▼ 3%" */
export function changeLabel(pct: number | null, suffix: string) {
  if (pct === null) return { text: `— ${suffix}`, up: null }
  return { text: `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}% ${suffix}`, up: pct >= 0 }
}

/** Hours left until a deadline (negative when overdue). */
export function hoursUntil(deadline: string) {
  return (new Date(deadline).getTime() - Date.now()) / 3_600_000
}
