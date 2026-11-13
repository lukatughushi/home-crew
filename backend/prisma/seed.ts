// Fills an empty database with the prototype's catalogue + the first admin.
// Safe to re-run: it only creates what's missing and never overwrites admin edits.
//   npm run db:seed
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { serviceCategories } from './seed-data.js'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

// Commission per category, from the admin design ("სერვისები და ფასები").
const commission: Record<string, number> = {
  cleaning: 15,
  gardening: 15,
  renovation: 12,
  construction: 10,
  electrical: 15,
  appliance: 15,
}

// Approved pros (from the UI + admin designs). First service = the category shown in the admin table.
const pros = [
  { name: 'მარიამ ბერიძე', tag: 'საუკეთესო 2026', district: 'ვაკე', years: 6, services: ['cleaning'] },
  { name: 'დავით კაპანაძე', tag: 'სწრაფი პასუხი', district: 'საბურთალო', years: 9, services: ['electrical', 'appliance'] },
  { name: 'სანდრო ოქროპირიძე', tag: 'ეკო საშუალებები', district: 'დიდუბე', years: 4, services: ['appliance', 'cleaning'] },
  { name: 'სალომე ჩხეიძე', tag: '', district: 'მთაწმინდა', years: 3, services: ['cleaning'] },
  { name: 'ლაშა ღლონტი', tag: '', district: 'წყნეთი', years: 5, services: ['gardening'] },
  { name: 'ზურაბ ნოზაძე', tag: '', district: 'ისანი', years: 8, services: ['renovation'], inactive: true },
  { name: 'ირაკლი შენგელია', tag: '', district: 'გლდანი', years: 11, services: ['construction', 'renovation'] },
]

// Applications waiting in the verification queue (admin → ხელოსნები → ვერიფიკაცია).
const applicants = [
  {
    name: 'გიორგი ბაქრაძე', district: 'საბურთალო', years: 7, services: ['electrical'],
    docs: [['პირადობა', true], ['ნასამართლობის ცნობა', true], ['ელექტრიკოსის სერტიფიკატი', false]],
  },
  {
    name: 'ქეთი მამულაშვილი', district: 'ვაკე', years: 3, services: ['cleaning'],
    docs: [['პირადობა', true], ['ნასამართლობის ცნობა', true], ['საცდელი დავალება', true]],
  },
  {
    name: 'ვახტანგ თოდუა', district: 'გლდანი', years: 5, services: ['appliance'],
    docs: [['პირადობა', true], ['ნასამართლობის ცნობა', false], ['დაზღვევა', true]],
  },
] as const

const reviews = [
  {
    authorName: 'ნინო ს.',
    meta: 'ღრმა დასუფთავება · ვაკე',
    quote:
      'საღამოს 9-ზე დავჯავშნე, დილის 10-ზე უკვე მოვიდნენ. ბინა ასეთი სუფთა არასდროს ყოფილა და ფასი ზუსტად ის იყო, რაც მითხრეს.',
  },
  {
    authorName: 'გიორგი რ.',
    meta: 'ელექტროობა · საბურთალო',
    quote: 'ორი ახალი როზეტი და გაფუჭებული სანათი ერთ საათში გამიკეთეს. სერტიფიკატი იმავე დღეს მომივიდა.',
  },
  {
    authorName: 'ანა კ.',
    meta: 'მებაღეობა · წყნეთი',
    quote: 'მებაღე ახლა ყოველ ორ კვირაში მოდის. ხელახლა დაჯავშნა ორი შეხებაა და ყოველთვის ვიცი, ვინ მოდის.',
  },
  {
    authorName: 'ლევან მ.',
    meta: 'ტექნიკის მონტაჟი · ბათუმი',
    quote: 'ჭურჭლის სარეცხი მიაერთეს და ძველიც წაიღეს. მოულოდნელი ხარჯი არ ყოფილა.',
  },
  {
    authorName: 'ეკა გ.',
    meta: 'რემონტი · ქუთაისი',
    quote: 'ვიდეო-შეფასებამ ერთი კვირა დამიზოგა. ფიქსირებული ფასი და ერთი დღით ადრე დაასრულეს.',
  },
]

async function seedServices() {
  let created = 0
  for (const [i, s] of serviceCategories.entries()) {
    const exists = await prisma.service.findUnique({ where: { id: s.id }, select: { id: true } })
    if (exists) continue
    await prisma.service.create({
      data: {
        id: s.id,
        name: s.name,
        service: s.service,
        keywords: s.keywords,
        description: s.description,
        photo: s.photo,
        icon: s.icon,
        included: s.included,
        excluded: s.excluded,
        priceFrom: s.priceFrom,
        commissionPercent: commission[s.id] ?? 15,
        sortOrder: i,
        packages: {
          create: s.packages.map((p, j) => ({
            name: p.name,
            description: p.description,
            price: p.price,
            isPopular: j === 1, // the design pre-selects and badges the middle package
            sortOrder: j,
          })),
        },
      },
    })
    created++
  }
  console.log(`services: ${created} created`)
}

async function seedPros() {
  if ((await prisma.pro.count()) > 0) return console.log('pros: skipped (table not empty)')
  for (const p of pros) {
    await prisma.pro.create({
      data: {
        name: p.name,
        tag: p.tag,
        district: p.district,
        experienceYears: p.years,
        status: 'APPROVED',
        isActive: !('inactive' in p && p.inactive),
        services: { connect: p.services.map((id) => ({ id })) },
      },
    })
  }
  for (const a of applicants) {
    await prisma.pro.create({
      data: {
        name: a.name,
        district: a.district,
        experienceYears: a.years,
        status: 'PENDING',
        services: { connect: a.services.map((id) => ({ id })) },
        documents: { create: a.docs.map(([name, isVerified]) => ({ name, isVerified })) },
      },
    })
  }
  console.log(`pros: ${pros.length} approved + ${applicants.length} applications created`)
}

async function seedReviews() {
  if ((await prisma.review.count()) > 0) return console.log('reviews: skipped (table not empty)')
  await prisma.review.createMany({
    data: reviews.map((r, i) => ({ ...r, rating: 5, isPublished: true, sortOrder: i })),
  })
  console.log(`reviews: ${reviews.length} created`)
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!email) return console.log('admin: skipped (ADMIN_EMAIL not set)')
  if (await prisma.admin.findUnique({ where: { email } })) return console.log(`admin: ${email} already exists`)
  if (!password || password === 'REPLACE_ME' || password.length < 10) {
    throw new Error('Set ADMIN_PASSWORD in backend/.env (at least 10 characters) before seeding')
  }
  await prisma.admin.create({
    data: {
      email,
      name: process.env.ADMIN_NAME?.trim() || 'ადმინისტრატორი',
      title: process.env.ADMIN_TITLE?.trim() || 'ოპერაციების მენეჯერი',
      passwordHash: await bcrypt.hash(password, 12),
    },
  })
  console.log(`admin: ${email} created — you can now remove ADMIN_PASSWORD from .env`)
}

try {
  await seedServices()
  await seedPros()
  await seedReviews()
  await seedAdmin()
} finally {
  await prisma.$disconnect()
}
