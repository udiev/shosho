const express = require('express')
const router = express.Router()
const { getBusinessBySlug, getAvailableSlots, createBooking } = require('../controllers/bookingController')

router.get('/:slug', getBusinessBySlug)
router.get('/:slug/slots', getAvailableSlots)
router.post('/:slug/book', createBooking)

module.exports = router
