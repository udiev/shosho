const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getServices, createService, updateService, deleteService } = require('../controllers/servicesController')

router.get('/', auth, getServices)
router.post('/', auth, createService)
router.put('/:id', auth, updateService)
router.delete('/:id', auth, deleteService)

module.exports = router
