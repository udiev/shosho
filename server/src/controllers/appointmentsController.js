const { getPool, sql } = require('../config/db')

async function getAppointments(req, res) {
  try {
    const pool = await getPool()
    const { from, to } = req.query
    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('from', sql.DateTime2, from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .input('to', sql.DateTime2, to || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      .query(`
        SELECT
          a.*,
          c.name as client_name, c.phone as client_phone,
          s.name as service_name, s.color as service_color, s.duration_minutes,
          u.name as staff_name
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN users u ON a.staff_id = u.id
        WHERE a.business_id = @businessId
          AND a.start_time >= @from
          AND a.start_time <= @to
        ORDER BY a.start_time ASC
      `)
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function createAppointment(req, res) {
  const { client_id, service_id, staff_id, start_time, end_time, notes } = req.body
  if (!start_time || !end_time) {
    return res.status(400).json({ error: 'שעת התחלה וסיום הם חובה' })
  }
  try {
    const pool = await getPool()

    // Check for conflicts
    const conflict = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('staffId', sql.UniqueIdentifier, staff_id)
      .input('start', sql.DateTime2, start_time)
      .input('end', sql.DateTime2, end_time)
      .query(`
        SELECT id FROM appointments
        WHERE business_id = @businessId
          AND staff_id = @staffId
          AND status NOT IN ('cancelled')
          AND (
            (start_time < @end AND end_time > @start)
          )
      `)

    if (conflict.recordset.length > 0) {
      return res.status(409).json({ error: 'קיים תור בשעה זו' })
    }

    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('clientId', sql.UniqueIdentifier, client_id || null)
      .input('serviceId', sql.UniqueIdentifier, service_id || null)
      .input('staffId', sql.UniqueIdentifier, staff_id || null)
      .input('start', sql.DateTime2, start_time)
      .input('end', sql.DateTime2, end_time)
      .input('notes', sql.NVarChar, notes || null)
      .query(`
        INSERT INTO appointments (business_id, client_id, service_id, staff_id, start_time, end_time, notes)
        OUTPUT INSERTED.*
        VALUES (@businessId, @clientId, @serviceId, @staffId, @start, @end, @notes)
      `)
    res.status(201).json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function updateAppointment(req, res) {
  const { status, notes, start_time, end_time } = req.body
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('status', sql.NVarChar, status)
      .input('notes', sql.NVarChar, notes || null)
      .input('start', sql.DateTime2, start_time)
      .input('end', sql.DateTime2, end_time)
      .query(`
        UPDATE appointments
        SET status=@status, notes=@notes, start_time=@start, end_time=@end
        OUTPUT INSERTED.*
        WHERE id=@id AND business_id=@businessId
      `)
    if (result.recordset.length === 0) return res.status(404).json({ error: 'תור לא נמצא' })
    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function deleteAppointment(req, res) {
  try {
    const pool = await getPool()
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query('DELETE FROM appointments WHERE id=@id AND business_id=@businessId')
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { getAppointments, createAppointment, updateAppointment, deleteAppointment }
