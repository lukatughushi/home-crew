// FAKE demo data for local development: ~2 weeks of bookings, two open disputes, job reviews.
// Run after `npm run db:seed`. Refuses to run in production or when bookings already exist.
//   npm run db:seed:demo
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { type BookingStatus, PrismaClient } from '../src/generated/prisma/client.js'

if (process.env.NODE_ENV === 'production') {
  console.error('seed-demo: refusing to run with NODE_ENV=production')
  process.exit(1)
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

// Deterministic randomness so every developer gets the same demo data.
let seed = 42
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32)
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]

const firstNames = ['ნინო', 'გიორგი', 'ანა', 'ლევან', 'ეკა', 'თამარ', 'დათო', 'სოფო', 'ნიკა', 'მაკა', 'ბექა', 'ქეთი', 'ლუკა', 'მარიამ', 'ირაკლი']
const lastNames = ['ბერიძე', 'რამიშვილი', 'კვარაცხელია', 'მელაძე', 'გელაშვილი', 'ჯაფარიძე', 'ხარაიშვილი', 'ლომიძე', 'წიკლაური', 'ცინცაძე']
const districts = ['ვაკე', 'საბურთალო', 'წყნეთი', 'დიდუბე', 'ისანი', 'გლდანი', 'ნაძალადევი', 'დიღომი', 'მთაწმინდა', 'ვერე']
const streets = ['ჭავჭავაძის გამზ.', 'პეკინის ქ.', 'წერეთლის გამზ.', 'ვაჟა-ფშაველას გამზ.', 'აბაშიძის ქ.']
const slots = ['08–10', '10–12', '12–14', '14–16', '16–18', '18–20']
const reviewQuotes = [
  'დროულად მოვიდა და ყველაფერი სუფთად გააკეთა.',
  'პროფესიონალი, ფასიც ზუსტად ის იყო, რაც ეწერა.',
  'კარგი სამუშაოა, თუმცა ცოტა დააგვიანა.',
  'ძალიან კმაყოფილი ვარ, აუცილებლად კიდევ დავჯავშნი.',
]

const tbilisiDay = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tbilisi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
const day = (offset: number) => {
  const d = new Date(`${tbilisiDay(new Date())}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d
}

function statusFor(offset: number): BookingStatus {
  const r = rand()
  if (offset < 0) return r < 0.88 ? 'COMPLETED' : 'CANCELLED'
  if (offset === 0) return r < 0.3 ? 'COMPLETED' : r < 0.55 ? 'IN_PROGRESS' : r < 0.85 ? 'CONFIRMED' : 'PENDING'
  return r < 0.65 ? 'CONFIRMED' : 'PENDING'
}

async function main() {
  if ((await prisma.booking.count()) > 0) {
    console.log('seed-demo: bookings table is not empty — nothing to do')
    return
  }
  const services = await prisma.service.findMany({
    include: { packages: true, pros: { where: { status: 'APPROVED', isActive: true } } },
  })
  if (!services.length) throw new Error('Run `npm run db:seed` first')

  const now = Date.now()
  let code = 48100
  const completed: { id: number; serviceName: string; district: string }[] = []

  for (let offset = -13; offset <= 3; offset++) {
    const perDay = 6 + Math.floor(rand() * 6)
    for (let i = 0; i < perDay; i++) {
      const s = pick(services)
      const pkg = pick(s.packages)
      let status = statusFor(offset)
      const pro = status === 'PENDING' || !s.pros.length ? null : pick(s.pros)
      if (!pro && status !== 'CANCELLED') status = 'PENDING'

      // Booked 0–2 days before the visit, never in the future.
      const createdAt = new Date(Math.min(now - 60_000, day(offset).getTime() - rand() * 2 * 86_400_000 + 9 * 3_600_000))
      const district = pick(districts)

      const b = await prisma.booking.create({
        data: {
          code: `HC-${code++}`,
          status,
          serviceId: s.id,
          packageId: pkg.id,
          proId: pro?.id ?? null,
          customerName: `${pick(firstNames)} ${pick(lastNames)}`,
          customerPhone: `+995 599 ${String(100000 + Math.floor(rand() * 899999)).replace(/(\d{2})(\d{2})(\d{2})/, '$1 $2 $3')}`,
          address: `${pick(streets)} ${1 + Math.floor(rand() * 120)}, ${district}`,
          district,
          date: day(offset),
          slot: pick(slots),
          price: pkg.price,
          fee: 3.5,
          commissionPercent: s.commissionPercent,
          createdAt,
          events: {
            create: [
              { message: 'ჯავშანი შეიქმნა · ვებ', createdAt },
              { message: 'თანხა დაიბლოკა ბარათზე', createdAt },
              ...(pro ? [{ message: `მიენიჭა: ${pro.name}`, createdAt: new Date(createdAt.getTime() + 8 * 60_000) }] : []),
              ...(status === 'CANCELLED' ? [{ message: 'ჯავშანი გაუქმდა · დაბლოკილი თანხა გათავისუფლდა', createdAt }] : []),
            ],
          },
        },
      })
      if (status === 'COMPLETED') completed.push({ id: b.id, serviceName: s.name, district })
    }
  }

  // Ratings for ~60% of finished jobs (not shown on the homepage until published).
  let reviews = 0
  for (const c of completed) {
    if (rand() > 0.6) continue
    const r = rand()
    await prisma.review.create({
      data: {
        bookingId: c.id,
        authorName: `${pick(firstNames)} ${pick(lastNames)[0]}.`,
        meta: `${c.serviceName} · ${c.district}`,
        quote: pick(reviewQuotes),
        rating: r < 0.75 ? 5 : r < 0.95 ? 4 : 3,
        isPublished: false,
      },
    })
    reviews++
  }

  // Two open disputes on recent finished jobs (one urgent).
  const disputeCases = [
    { hours: 21, reason: 'ღუმელი და ფანჯრები არ გაიწმინდა, თუმცა „სრული" პაკეტი იყო შეკვეთილი.', photos: 3, reply: 'ღუმელის საწმენდი საშუალება ადგილზე არ იყო, მომხმარებელს შევთავაზე ხვალ მოსვლა.' },
    { hours: 6, reason: 'სამუშაო ბოლომდე არ დასრულებულა, ხელოსანი გამოსასწორებლად აღარ მოსულა.', photos: 5, reply: '' },
  ]
  const recent = completed.slice(-2 * disputeCases.length).filter((_, i) => i % 2 === 0)
  for (const [i, d] of disputeCases.entries()) {
    const bookingId = recent[i]?.id
    if (!bookingId) break
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'DISPUTED', events: { create: { message: 'მომხმარებელმა გახსნა დავა' } } },
    })
    await prisma.dispute.create({
      data: { bookingId, reason: d.reason, photos: d.photos, proReply: d.reply, deadline: new Date(now + d.hours * 3_600_000) },
    })
  }

  const total = await prisma.booking.count()
  console.log(`seed-demo: ${total} bookings, ${reviews} job reviews, ${disputeCases.length} disputes created`)
}

try {
  await main()
} finally {
  await prisma.$disconnect()
}
