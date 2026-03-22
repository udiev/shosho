const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getDashboardStats } = require('../controllers/statsController')

router.get('/dashboard', auth, getDashboardStats)

module.exports = router
