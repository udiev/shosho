const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getAvailability, createAvailability, deleteAvailability } = require('../controllers/availabilityController')

router.get('/', auth, getAvailability)
router.post('/', auth, createAvailability)
router.delete('/:id', auth, deleteAvailability)

module.exports = router
