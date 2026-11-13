import express, { Router } from 'express'
import * as auth from '../controllers/admin/auth.controller.js'
import * as bookings from '../controllers/admin/bookings.controller.js'
import * as dashboard from '../controllers/admin/dashboard.controller.js'
import * as disputes from '../controllers/admin/disputes.controller.js'
import * as media from '../controllers/admin/media.controller.js'
import * as payouts from '../controllers/admin/payouts.controller.js'
import * as pros from '../controllers/admin/pros.controller.js'
import * as reviews from '../controllers/admin/reviews.controller.js'
import * as services from '../controllers/admin/services.controller.js'
import { IMAGE_TYPES, MAX_UPLOAD_BYTES } from '../lib/uploads.js'
import { loginLimiter } from '../middleware/loginLimiter.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

// Mounted at /api/admin
const router = Router()

router.post('/auth/login', loginLimiter, auth.login)
router.post('/auth/logout', auth.logout)

// Everything below needs a logged-in admin.
router.use(requireAdmin)

router.get('/auth/me', auth.me)
router.get('/stats', dashboard.getStats)
router.get('/badges', dashboard.getBadges)

router.get('/bookings', bookings.list)
router.get('/bookings/:id', bookings.get)
router.patch('/bookings/:id', bookings.update)
router.post('/bookings/:id/cancel', bookings.cancel)
router.post('/bookings/:id/refund', bookings.refund)

router.get('/pros', pros.list)
router.post('/pros', pros.create)
router.get('/pros/:id', pros.get)
router.put('/pros/:id', pros.update)
router.patch('/pros/:id', pros.patch)
router.delete('/pros/:id', pros.remove)
router.post('/pros/:id/approve', pros.approve)
router.post('/pros/:id/reject', pros.reject)
router.post('/pros/:id/request-docs', pros.requestDocs)
router.patch('/pros/:id/documents/:docId', pros.setDocument)

router.get('/services', services.list)
router.patch('/services', services.bulkUpdate)
router.post('/services', services.create)
router.get('/services/:id', services.get)
router.put('/services/:id', services.update)
router.delete('/services/:id', services.remove)

router.get('/payouts', payouts.list)
router.post('/payouts', payouts.create)
router.post('/payouts/all', payouts.createAll)

router.get('/disputes', disputes.list)
router.post('/disputes/:id/resolve', disputes.resolve)

router.get('/reviews', reviews.list)
router.post('/reviews', reviews.create)
router.put('/reviews/:id', reviews.update)
router.delete('/reviews/:id', reviews.remove)

// Images (admin -> media page). The file is sent as the raw request body.
const imageBody = express.raw({ type: IMAGE_TYPES, limit: MAX_UPLOAD_BYTES })
router.get('/media', media.list)
router.post('/media/hero', imageBody, media.addHeroSlide)
router.put('/media/hero/order', media.reorderHeroSlides)
router.delete('/media/hero/:id', media.removeHeroSlide)
router.put('/media/services/:id', imageBody, media.uploadServicePhoto)
router.delete('/media/services/:id', media.removeServicePhoto)

export default router
