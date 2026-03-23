const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getDashboardStats } = require('../controllers/statsController')
const { getAnalytics } = require('../controllers/analyticsController')

router.get('/dashboard', auth, getDashboardStats)
router.get('/analytics', auth, getAnalytics)

module.exports = router
