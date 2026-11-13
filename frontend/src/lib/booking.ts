// Booking calendar helpers. Everything is in Tbilisi time (UTC+4, no DST), like the backend.

export const SLOTS = [
  { slot: '08–10', start: '08:00' },
  { slot: '10–12', start: '10:00' },
  { slot: '12–14', start: '12:00' },
  { slot: '14–16', start: '14:00' },
  { slot: '16–18', start: '16:00' },
  { slot: '18–20', start: '18:00' },
] as const

export const BOOKING_FEE = 3.5
/** Days shown in the picker (the server accepts up to 14). */
const DAYS_SHOWN = 7
/** Same as the server: a slot can be booked until 1 hour before it starts. */
const MIN_LEAD_MS = 60 * 60 * 1000

const DOW = ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ']
const DOW_LONG = ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი']
const MONTHS_SHORT = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოემ', 'დეკ']
const MONTHS = ['იანვარს', 'თებერვალს', 'მარტს', 'აპრილს', 'მაისს', 'ივნისს', 'ივლისს', 'აგვისტოს', 'სექტემბერს', 'ოქტომბერს', 'ნოემბერს', 'დეკემბერს']

const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tbilisi', year: 'numeric', month: '2-digit', day: '2-digit' })

export const tbilisiToday = () => ymd.format(new Date())

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const parts = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`)
  return { dow: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth() }
}

export interface DayOption {
  iso: string
  dow: string
  num: number
}

/** Today + the next 6 days. */
export function bookingDays(): DayOption[] {
  const today = tbilisiToday()
  return Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const iso = addDays(today, i)
    const { dow, day } = parts(iso)
    return { iso, dow: i === 0 ? 'დღეს' : DOW[dow], num: day }
  })
}

/** False for slots that already started (or start within the hour). */
export function slotAvailable(iso: string, slot: string) {
  const start = new Date(`${iso}T${String(Number.parseInt(slot, 10)).padStart(2, '0')}:00:00+04:00`)
  return start.getTime() - Date.now() > MIN_LEAD_MS
}

/** Today, or tomorrow once today's last slot is gone. */
export function firstOpenDay() {
  const days = bookingDays()
  return (days.find((d) => SLOTS.some((s) => slotAvailable(d.iso, s.slot))) ?? days[1]).iso
}

/** "ხუთ, 12 ნოემ" */
export function shortDay(iso: string) {
  const { dow, day, month } = parts(iso)
  return `${DOW[dow]}, ${day} ${MONTHS_SHORT[month]}`
}

/** "12 ნოემბერს (ხუთშაბათი)" */
export function longDay(iso: string) {
  const { dow, day, month } = parts(iso)
  return `${day} ${MONTHS[month]} (${DOW_LONG[dow]})`
}

/** "დღეს" / "ხვალ" / "ხუთ, 12 ნოემ" */
export function relativeDay(iso: string) {
  const today = tbilisiToday()
  if (iso === today) return 'დღეს'
  if (iso === addDays(today, 1)) return 'ხვალ'
  return shortDay(iso)
}

/** "10–12" → "10:00–12:00" */
export const slotRange = (slot: string) => slot.split('–').map((h) => `${h}:00`).join('–')

export const PROPERTY_TYPES = [
  { id: 'HOUSE', label: 'სახლი' },
  { id: 'APARTMENT', label: 'ბინა' },
  { id: 'OFFICE', label: 'ოფისი' },
] as const
