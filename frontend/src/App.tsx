import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AdminLayout from '@/components/admin/AdminLayout'
import Layout from '@/components/layout/Layout'
import BookingsPage from '@/pages/admin/BookingsPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import DisputesPage from '@/pages/admin/DisputesPage'
import LoginPage from '@/pages/admin/LoginPage'
import MediaPage from '@/pages/admin/MediaPage'
import PaymentsPage from '@/pages/admin/PaymentsPage'
import ProsPage from '@/pages/admin/ProsPage'
import ReviewsPage from '@/pages/admin/ReviewsPage'
import ServicesPage from '@/pages/admin/ServicesPage'
import AccountPage from '@/pages/AccountPage'
import BookingPage from '@/pages/BookingPage'
import HomePage from '@/pages/HomePage'
import CustomerLoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ServicePage from '@/pages/ServicePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public website */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services/:id" element={<ServicePage />} />
          <Route path="/book/:id" element={<BookingPage />} />
          <Route path="/login" element={<CustomerLoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin panel */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="pros" element={<ProsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="disputes" element={<DisputesPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="media" element={<MediaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
