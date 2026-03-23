const { getPool, sql } = require('../config/db')
const { getHoursForBusiness } = require('./hoursController')

async function getBusinessBySlug(req, res) {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('slug', sql.NVarChar, req.params.slug)
      .query('SELECT id, name, description, primary_color, secondary_color, phone FROM businesses WHERE slug = @slug')
    if (result.recordset.length === 0) return res.status(404).json({ error: 'עסק לא נמצא' })
    const business = result.recordset[0]
    const services = await pool.request()
      .input('businessId', sql.UniqueIdentifier, business.id)
      .query('SELECT id, name, duration_minutes, price, color FROM services WHERE business_id = @businessId AND is_active = 1')
    res.json({ business, services: services.recordset })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function getAvailableSlots(req, res) {
  const { date, service_id } = req.query
  try {
    const pool = await getPool()
    const bizResult = await pool.request()
      .input('slug', sql.NVarChar, req.params.slug)
      .query('SELECT id FROM businesses WHERE slug = @slug')
    if (bizResult.recordset.length === 0) return res.status(404).json({ error: 'עסק לא נמצא' })
    const businessId = bizResult.recordset[0].id
    const serviceResult = await pool.request()
      .input('serviceId', sql.UniqueIdentifier, service_id)
      .query('SELECT duration_minutes FROM services WHERE id = @serviceId')
    const duration = serviceResult.recordset[0]?.duration_minutes || 60

    // Use business hours for the requested day
    const hours = await getHoursForBusiness(pool, businessId)
    const dayOfWeek = new Date(date + 'T12:00:00').getDay() // use noon to avoid DST issues
    const dayHours = hours[dayOfWeek]
    if (!dayHours.is_open) return res.json([]) // business closed this day

    const dayStart = new Date(date + 'T' + dayHours.open_time + ':00')
    const dayEnd = new Date(date + 'T' + dayHours.close_time + ':00')
    const existing = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('from', sql.DateTime2, dayStart)
      .input('to', sql.DateTime2, dayEnd)
      .query('SELECT start_time, end_time FROM appointments WHERE business_id = @businessId AND start_time >= @from AND start_time <= @to AND status NOT IN (\'cancelled\')')
    const slots = []
    const current = new Date(dayStart)
    while (current < dayEnd) {
      const slotEnd = new Date(current.getTime() + duration * 60000)
      if (slotEnd <= dayEnd) {
        const conflict = existing.recordset.some(appt => {
          const s = new Date(appt.start_time)
          const e = new Date(appt.end_time)
          return current < e && slotEnd > s
        })
        if (!conflict) {
          slots.push({
            start: current.toISOString(),
            end: slotEnd.toISOString(),
            label: current.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
          })
        }
      }
      current.setMinutes(current.getMinutes() + 30)
    }
    res.json(slots)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function createBooking(req, res) {
  const { service_id, start_time, end_time, client_name, client_phone, client_email, notes } = req.body
  if (!service_id || !start_time || !client_name || !client_phone) {
    return res.status(400).json({ error: 'שם, טלפון ושירות הם חובה' })
  }
  try {
    const pool = await getPool()
    const bizResult = await pool.request()
      .input('slug', sql.NVarChar, req.params.slug)
      .query('SELECT id FROM businesses WHERE slug = @slug')
    if (bizResult.recordset.length === 0) return res.status(404).json({ error: 'עסק לא נמצא' })
    const businessId = bizResult.recordset[0].id
    let clientId = null
    const existingClient = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('phone', sql.NVarChar, client_phone)
      .query('SELECT id FROM clients WHERE business_id = @businessId AND phone = @phone')
    if (existingClient.recordset.length > 0) {
      clientId = existingClient.recordset[0].id
    } else {
      const newClient = await pool.request()
        .input('businessId', sql.UniqueIdentifier, businessId)
        .input('name', sql.NVarChar, client_name)
        .input('phone', sql.NVarChar, client_phone)
        .input('email', sql.NVarChar, client_email || null)
        .query('INSERT INTO clients (business_id, name, phone, email) OUTPUT INSERTED.id VALUES (@businessId, @name, @phone, @email)')
      clientId = newClient.recordset[0].id
    }
    await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('clientId', sql.UniqueIdentifier, clientId)
      .input('serviceId', sql.UniqueIdentifier, service_id)
      .input('start', sql.DateTime2, start_time)
      .input('end', sql.DateTime2, end_time)
      .input('notes', sql.NVarChar, notes || null)
      .query('INSERT INTO appointments (business_id, client_id, service_id, start_time, end_time, status) VALUES (@businessId, @clientId, @serviceId, @start, @end, \'scheduled\')')
    res.status(201).json({ success: true, message: 'התור נקבע בהצלחה!' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { getBusinessBySlug, getAvailableSlots, createBooking }
