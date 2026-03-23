const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { getPool } = require('./config/db')
const authRoutes = require('./routes/auth')
const servicesRoutes = require('./routes/services')
const clientsRoutes = require('./routes/clients')
const appointmentsRoutes = require('./routes/appointments')
const statsRoutes = require('./routes/stats')
const businessRoutes = require('./routes/business')
const bookingRoutes = require('./routes/booking')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*' }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Shosho API is running 🌸' })
})

app.use('/api/auth', authRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/clients', clientsRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/business', businessRoutes)
app.use('/api/book', bookingRoutes)

async function start() {
  try {
    await getPool()
    app.listen(PORT, () => {
      console.log(`🌸 Shosho server running on port ${PORT}`)
    })
    const { startRemindersJob } = require('./jobs/reminders')
    startRemindersJob()
  } catch (err) {
    console.error('❌ Failed to connect to DB:', err.message)
    process.exit(1)
  }
}

start()
