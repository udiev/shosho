const { getPool, sql } = require('../config/db')
const { getHoursForBusiness } = require('./hoursController')

// Compact scheduling: only offer slots adjacent to existing appointments.
// If no appointments yet in the window, offer all 30-min slots from window start.
function compactSlots(winStart, winEnd, durMin, existing) {
  const durMs = durMin * 60000
  const inWindow = existing.filter(a => {
    const s = new Date(a.start_time)
    return s >= winStart && s < winEnd
  })

  if (inWindow.length === 0) {
    // Window is empty — offer all slots from the start
    const slots = []
    const cur = new Date(winStart)
    while (cur.getTime() + durMs <= winEnd.getTime()) {
      slots.push({ start: new Date(cur), end: new Date(cur.getTime() + durMs) })
      cur.setMinutes(cur.getMinutes() + 30)
    }
    return slots
  }

  // Find the span of booked appointments in this window
  const sorted = [...inWindow].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const firstStart = new Date(sorted[0].start_time)
  const lastEnd   = new Date(sorted[sorted.length - 1].end_time)

  const slots = []

  // Slot immediately BEFORE the first appointment
  const beforeStart = new Date(firstStart.getTime() - durMs)
  if (beforeStart >= winStart) {
    slots.push({ start: beforeStart, end: firstStart })
  }

  // Slot immediately AFTER the last appointment
  const afterEnd = new Date(lastEnd.getTime() + durMs)
  if (afterEnd <= winEnd) {
    slots.push({ start: lastEnd, end: afterEnd })
  }

  return slots
}

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

    // Fetch all existing appointments for the day (used for conflict + compact checks)
    const dayFull = new Date(date + 'T00:00:00')
    const dayEnd  = new Date(date + 'T23:59:59')
    const existing = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('from', sql.DateTime2, dayFull)
      .input('to',   sql.DateTime2, dayEnd)
      .query(`SELECT start_time, end_time FROM appointments
              WHERE business_id = @businessId
                AND start_time >= @from AND start_time <= @to
                AND status NOT IN ('cancelled')`)

    // Check for explicit availability windows for this day
    let avResult
    try {
      avResult = await pool.request()
        .input('businessId', sql.UniqueIdentifier, businessId)
        .input('date', sql.Date, date)
        .query(`SELECT start_time, end_time FROM availability_slots
                WHERE business_id = @businessId AND date = @date
                ORDER BY start_time`)
    } catch {
      avResult = { recordset: [] }
    }

    const toSlot = s => ({
      start: s.start.toISOString(),
      end:   s.end.toISOString(),
      label: s.start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    })

    if (avResult.recordset.length > 0) {
      // Explicit availability windows exist → use compact scheduling per window
      const slots = []
      for (const win of avResult.recordset) {
        const winStart = new Date(date + 'T' + win.start_time + ':00')
        const winEnd   = new Date(date + 'T' + win.end_time   + ':00')
        compactSlots(winStart, winEnd, duration, existing.recordset)
          .filter(s => !existing.recordset.some(a =>
            s.start < new Date(a.end_time) && s.end > new Date(a.start_time)))
          .forEach(s => slots.push(toSlot(s)))
      }
      return res.json(slots)
    }

    // No availability windows — fall back to business hours, all 30-min slots
    const hours = await getHoursForBusiness(pool, businessId)
    const dayOfWeek = new Date(date + 'T12:00:00').getDay()
    const dayHours = hours[dayOfWeek]
    if (!dayHours.is_open) return res.json([])

    const start = new Date(date + 'T' + dayHours.open_time  + ':00')
    const end   = new Date(date + 'T' + dayHours.close_time + ':00')
    const slots = []
    const cur = new Date(start)
    while (cur < end) {
      const slotEnd = new Date(cur.getTime() + duration * 60000)
      if (slotEnd <= end) {
        const conflict = existing.recordset.some(a =>
          cur < new Date(a.end_time) && slotEnd > new Date(a.start_time))
        if (!conflict) {
          slots.push({ start: cur.toISOString(), end: slotEnd.toISOString(),
            label: cur.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) })
        }
      }
      cur.setMinutes(cur.getMinutes() + 30)
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
