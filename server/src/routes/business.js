const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getBusiness, updateBusiness } = require('../controllers/businessController')
const { getHours, updateHours } = require('../controllers/hoursController')

router.get('/', auth, getBusiness)
router.put('/', auth, updateBusiness)
router.get('/hours', auth, getHours)
router.put('/hours', auth, updateHours)

module.exports = router
