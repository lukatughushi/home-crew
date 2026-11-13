import { Router } from 'express'
import { createBooking } from '../controllers/bookings.controller.js'
import { getHealth } from '../controllers/health.controller.js'
import * as account from '../controllers/account.controller.js'
import { getService, listPublishedReviews, listServicePros, listServices } from '../controllers/services.controller.js'
import { loadCustomer, requireCustomer } from '../middleware/customerAuth.js'
import { loginLimiter } from '../middleware/loginLimiter.js'
import { publicSite } from '../controllers/admin/media.controller.js'
import adminRoutes from './admin.js'

// Mounted at /api
const router = Router()

router.get('/health', getHealth)
router.get('/services', listServices)
router.get('/services/:id', getService)
router.get('/services/:id/pros', listServicePros)
router.get('/reviews', listPublishedReviews)
router.get('/site', publicSite)

// Website accounts (cookie hc_session)
router.post('/account/register', loginLimiter, account.register)
router.post('/account/login', loginLimiter, account.login)
router.post('/account/logout', account.logout)
router.get('/account/me', loadCustomer, account.me)
router.patch('/account/me', loadCustomer, requireCustomer, account.updateMe)
router.get('/account/bookings', loadCustomer, requireCustomer, account.myBookings)
router.post('/account/bookings/:id/cancel', loadCustomer, requireCustomer, account.cancelMyBooking)
router.post('/account/bookings/:id/review', loadCustomer, requireCustomer, account.reviewMyBooking)
router.get('/account/transactions', loadCustomer, requireCustomer, account.myTransactions)
router.post('/account/wallet/topup', loadCustomer, requireCustomer, account.topUp)

// Booking needs an account: it's paid from the account balance.
router.post('/bookings', loadCustomer, requireCustomer, createBooking)

router.use('/admin', adminRoutes)

export default router
