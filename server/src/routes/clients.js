const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { getClients, createClient, updateClient, deleteClient } = require('../controllers/clientsController')

router.get('/', auth, getClients)
router.post('/', auth, createClient)
router.put('/:id', auth, updateClient)
router.delete('/:id', auth, deleteClient)

module.exports = router
