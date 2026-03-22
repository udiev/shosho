const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getBusiness, updateBusiness } = require('../controllers/businessController')

router.get('/', auth, getBusiness)
router.put('/', auth, updateBusiness)

module.exports = router
