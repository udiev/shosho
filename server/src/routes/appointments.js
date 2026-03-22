const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointmentsController')

router.get('/', auth, getAppointments)
router.post('/', auth, createAppointment)
router.put('/:id', auth, updateAppointment)
router.delete('/:id', auth, deleteAppointment)

module.exports = router
