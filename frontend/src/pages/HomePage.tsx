import CategoryGrid from '@/components/home/CategoryGrid'
import Hero from '@/components/home/Hero'
import HowItWorks from '@/components/home/HowItWorks'
import Testimonials from '@/components/home/Testimonials'
import TrustBand from '@/components/home/TrustBand'

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <HowItWorks />
      <TrustBand />
      <Testimonials />
    </>
  )
}
