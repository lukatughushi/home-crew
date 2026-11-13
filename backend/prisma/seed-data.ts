// Initial catalogue, taken from the HomeCrew UI prototype (Georgian version).
// Used only by prisma/seed.ts. After seeding, edit services in the admin panel.

export interface ServicePackage {
  name: string
  price: number
  description: string
}

export interface ServiceCategory {
  id: string
  name: string
  service: string
  keywords: string
  priceFrom: number
  rating: number
  reviews: number
  pros: number
  photo: string
  icon: string // SVG path data, 24x24 viewBox
  description: string
  packages: ServicePackage[]
  included: string[]
  excluded: string[]
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'cleaning',
    name: 'სახლის დასუფთავება',
    service: 'სახლის ღრმა დასუფთავება',
    keywords: 'clean დასუფთავება დალაგება ალაგება ღუმელი',
    priceFrom: 49,
    rating: 4.9,
    reviews: 2318,
    pros: 2140,
    photo: 'სუფთა სამზარეულო',
    icon: 'M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z',
    description:
      'სრული დასუფთავება შემოწმებული პროფესიონალისგან, რომელსაც ეკოლოგიური საშუალებები და აღჭურვილობა თან მოაქვს. იდეალურია სტუმრების მოსვლამდე, რემონტის შემდეგ ან სეზონურად.',
    packages: [
      { name: 'ბაზისური', price: 79, description: '2 საძინებლამდე · ~3 სთ' },
      { name: 'სტანდარტული', price: 119, description: '3 საძინებლამდე · ~4.5 სთ' },
      { name: 'სრული', price: 169, description: '4+ საძინებელი · ~6 სთ, ღუმელი და ფანჯრები' },
    ],
    included: [
      'სამზარეულოს ზედაპირები და ტექნიკა',
      'აბაზანის ნადების მოცილება და დეზინფექცია',
      'იატაკის მტვერსასრუტით წმენდა და რეცხვა',
      'საშუალებები და აღჭურვილობა ხელოსნისგან',
    ],
    excluded: ['ფანჯრები გარედან', 'ხალიჩის ქიმწმენდა'],
  },
  {
    id: 'gardening',
    name: 'მებაღეობა',
    service: 'ბაღის მოვლა',
    keywords: 'garden ბაღი გაზონი თიბვა ღობე სარეველა',
    priceFrom: 39,
    rating: 4.8,
    reviews: 1204,
    pros: 980,
    photo: 'მოწესრიგებული გაზონი',
    icon: 'M12 21V11M12 11C12 7 9 4 4 4c0 4 3 7 8 7zM12 13c0-3 2.5-6 7-6 0 4-3 6-7 6z',
    description:
      'გაზონის, ცოცხალი ღობისა და ყვავილნარების მოვლა ადგილობრივი მებაღეებისგან. ერთჯერადი ან რეგულარული ვიზიტები.',
    packages: [
      { name: 'გაზონის მოვლა', price: 59, description: 'თიბვა, კიდეები, ნარჩენების გატანა' },
      { name: 'სეზონური', price: 99, description: 'გაზონი, ღობე, სარეველა · ~3 სთ' },
      { name: 'სრული განახლება', price: 249, description: 'გასუფთავება, დარგვა და ნარჩენები' },
    ],
    included: ['თიბვა და კიდეების მოწესრიგება', 'ბუჩქებისა და ღობის შეჭრა', 'კვლების გამარგვლა', 'მწვანე ნარჩენების გატანა'],
    excluded: ['ხეების მოჭრა', 'მცენარეები და მასალები'],
  },
  {
    id: 'renovation',
    name: 'რემონტი',
    service: 'ინტერიერის რემონტი',
    keywords: 'renovat რემონტი შეღებვა ბათქაში',
    priceFrom: 320,
    rating: 4.8,
    reviews: 846,
    pros: 410,
    photo: 'ახლად შეღებილი მისაღები',
    icon: 'M4 4h13v5H4zM17 6.5h3V12h-8v3M11 15h2v6h-2z',
    description: 'შეღებვა, შელესვა და ოთახების განახლება — ფიქსირებული ფასი უფასო ვიდეო-შეფასების შემდეგ.',
    packages: [
      { name: 'ერთი ოთახი', price: 320, description: 'კედლები და ჭერი, 1 ოთახი' },
      { name: 'ორი ოთახი', price: 690, description: 'შეღებვა + მცირე შელესვა' },
      { name: 'მთელი სართული', price: 1450, description: '4 ოთახამდე, მომზადებით' },
    ],
    included: ['ზედაპირის მომზადება', 'საღებავის ორი ფენა', 'ავეჯის გადაწევა და დაფარვა', 'სრული დალაგება'],
    excluded: ['შპალერის მოხსნა', 'კონსტრუქციული სამუშაო'],
  },
  {
    id: 'construction',
    name: 'მშენებლობა',
    service: 'სამშენებლო სამუშაოები',
    keywords: 'build მშენებლობა მიშენება კედელი ეზო აგური',
    priceFrom: 89,
    rating: 4.7,
    reviews: 512,
    pros: 260,
    photo: 'მიშენების აგურის წყობა',
    icon: 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6',
    description: 'ეზოს კედლიდან მიშენებამდე — ლიცენზირებული მშენებლები, ეტაპობრივი გადახდით.',
    packages: [
      { name: 'ობიექტის შეფასება', price: 89, description: 'ადგილზე შეფასება და ხარჯთაღრიცხვა' },
      { name: 'მცირე მშენებლობა', price: 1200, description: 'ეზოს კედელი, ბაქანი ან კიბე' },
      { name: 'მიშენების გეგმა', price: 2500, description: 'ნახაზები, ნებართვები, გრაფიკი' },
    ],
    included: [
      'ლიცენზირებული, დაზღვეული მშენებლები',
      'მასალების სია და ხარჯთაღრიცხვა',
      'ეტაპობრივი გადახდა',
      'ობიექტის ყოველდღიური დალაგება',
    ],
    excluded: ['ნებართვის მოსაკრებლები', 'ნაგვის კონტეინერი'],
  },
  {
    id: 'electrical',
    name: 'ელექტროობა',
    service: 'ელექტრო სამუშაოები',
    keywords: 'electric ელექტრო როზეტი ჩამრთველი სინათლე სანათი გაყვანილობა',
    priceFrom: 69,
    rating: 4.9,
    reviews: 1577,
    pros: 730,
    photo: 'ელექტრიკოსი სანათს ამაგრებს',
    icon: 'M13 2L4 14h7l-1 8 9-12h-7z',
    description:
      'სერტიფიცირებული ელექტრიკოსები დაზიანებებისთვის, ახალი როზეტებისთვის, განათებისა და უსაფრთხოების შემოწმებისთვის.',
    packages: [
      { name: 'გამოძახება + 1 სთ', price: 69, description: 'მცირე დაზიანების დიაგნოსტიკა და შეკეთება' },
      { name: 'მონტაჟი', price: 99, description: '2-მდე როზეტი ან სანათი' },
      { name: 'შემოწმება', price: 149, description: 'სრული შემოწმება და სერტიფიკატი' },
    ],
    included: ['სერტიფიცირებული ელექტრიკოსი', 'ტესტირება დასრულებისას', 'სტანდარტული ფიტინგები', '12-თვიანი გარანტია'],
    excluded: ['სრული გაყვანილობა', 'ვიზიტის შემდეგ მოწოდებული მასალა'],
  },
  {
    id: 'appliance',
    name: 'ტექნიკის მონტაჟი',
    service: 'საყოფაცხოვრებო ტექნიკის მონტაჟი',
    keywords: 'appliance ტექნიკა სარეცხი მანქანა ჭურჭლის ღუმელი მონტაჟი',
    priceFrom: 59,
    rating: 4.8,
    reviews: 938,
    pros: 520,
    photo: 'ჭურჭლის სარეცხი მანქანის მონტაჟი',
    icon: 'M5 3h14v18H5zM5 7h14M8 5h.01M12 15m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
    description:
      'სარეცხი და ჭურჭლის სარეცხი მანქანები, ღუმელები და სხვა — მიერთებული, შემოწმებული, ძველი ტექნიკა გატანილი.',
    packages: [
      { name: 'ერთი ერთეული', price: 59, description: 'ერთი თავისუფლად მდგომი ტექნიკა' },
      { name: 'ჩაშენებული', price: 99, description: 'ერთი ჩაშენებული ტექნიკა' },
      { name: 'სამზარეულოს პაკეტი', price: 219, description: '3 ერთეულამდე' },
    ],
    included: ['მიერთება არსებულ სისტემაზე', 'გაჟონვისა და მუშაობის ტესტი', 'შეფუთვის გატანა', 'ძველი ტექნიკის გადამუშავება'],
    excluded: ['ახალი სანტექნიკური მილები', 'კარადის გადაკეთება'],
  },
]
