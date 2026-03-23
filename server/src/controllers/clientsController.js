const { getPool, sql } = require('../config/db')

async function ensureMessagesTable(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'client_messages')
    CREATE TABLE client_messages (
      id INT IDENTITY PRIMARY KEY,
      business_id UNIQUEIDENTIFIER NOT NULL,
      client_id   UNIQUEIDENTIFIER NOT NULL,
      message_type NVARCHAR(50)  NOT NULL, -- 'reminder','reengagement','slots_available'
      channel      NVARCHAR(20)  NOT NULL DEFAULT 'sms',
      message_body NVARCHAR(1000) NULL,
      sent_at      DATETIME2     NOT NULL DEFAULT GETDATE(),
      status       NVARCHAR(20)  NOT NULL DEFAULT 'sent'
    )
  `)
}

// Detect if a client is "at risk": hasn't visited in >1.5× their avg interval, no future appt
function detectAtRisk(completedAppts, nextAppointment) {
  if (completedAppts.length < 2) return false
  if (nextAppointment) return false

  const sorted = [...completedAppts].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const intervals = []
  for (let i = 1; i < sorted.length; i++) {
    intervals.push((new Date(sorted[i].start_time) - new Date(sorted[i - 1].start_time)) / 86400000)
  }
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const daysSinceLast = (Date.now() - new Date(sorted[sorted.length - 1].start_time)) / 86400000

  return daysSinceLast > avgInterval * 1.5
}

async function getClients(req, res) {
  try {
    const pool = await getPool()
    const search = req.query.search || ''
    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('search', sql.NVarChar, `%${search}%`)
      .query(`
        SELECT
          c.*,
          (SELECT COUNT(*) FROM appointments a
           WHERE a.client_id = c.id AND a.status = 'completed') as visit_count,
          (SELECT MAX(a.start_time) FROM appointments a
           WHERE a.client_id = c.id AND a.status = 'completed') as last_visit,
          (SELECT MIN(a.start_time) FROM appointments a
           WHERE a.client_id = c.id
             AND a.status IN ('scheduled','confirmed')
             AND a.start_time > GETDATE()) as next_appointment
        FROM clients c
        WHERE c.business_id = @businessId
          AND (c.name LIKE @search OR c.phone LIKE @search OR c.email LIKE @search)
        ORDER BY c.name ASC
      `)
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function getClient(req, res) {
  try {
    const pool = await getPool()
    await ensureMessagesTable(pool)

    // Client + summary stats
    const clientResult = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query(`
        SELECT
          c.*,
          (SELECT COUNT(*) FROM appointments a WHERE a.client_id = c.id AND a.status = 'completed') as completed_count,
          (SELECT COUNT(*) FROM appointments a WHERE a.client_id = c.id AND a.status != 'cancelled') as total_count,
          (SELECT COUNT(*) FROM appointments a WHERE a.client_id = c.id AND a.status = 'no_show') as no_show_count,
          (SELECT ISNULL(SUM(s.price),0) FROM appointments a JOIN services s ON a.service_id=s.id
           WHERE a.client_id = c.id AND a.status = 'completed') as total_revenue,
          (SELECT MAX(a.start_time) FROM appointments a WHERE a.client_id = c.id AND a.status = 'completed') as last_visit,
          (SELECT MIN(a.start_time) FROM appointments a
           WHERE a.client_id = c.id AND a.status IN ('scheduled','confirmed') AND a.start_time > GETDATE()) as next_appointment
        FROM clients c
        WHERE c.id = @id AND c.business_id = @businessId
      `)

    if (clientResult.recordset.length === 0) return res.status(404).json({ error: 'לקוח לא נמצא' })
    const client = clientResult.recordset[0]

    // Full appointment history
    const historyResult = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query(`
        SELECT a.id, a.start_time, a.end_time, a.status, a.notes,
               s.name as service_name, s.color as service_color, s.price,
               ISNULL(s.price, 0) as amount
        FROM appointments a
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.client_id = @id AND a.business_id = @businessId
        ORDER BY a.start_time DESC
      `)

    // Message history (count only for now)
    const msgResult = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query(`SELECT COUNT(*) as msg_count FROM client_messages
              WHERE client_id = @id AND business_id = @businessId`)

    const completedAppts = historyResult.recordset.filter(a => a.status === 'completed')
    const at_risk = detectAtRisk(completedAppts, client.next_appointment)

    res.json({
      client: { ...client, at_risk },
      history: historyResult.recordset,
      msg_count: msgResult.recordset[0].msg_count,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function createClient(req, res) {
  const { name, phone, email, notes } = req.body
  if (!name) return res.status(400).json({ error: 'שם הוא חובה' })
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || null)
      .input('email', sql.NVarChar, email || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`INSERT INTO clients (business_id, name, phone, email, notes)
              OUTPUT INSERTED.* VALUES (@businessId, @name, @phone, @email, @notes)`)
    res.status(201).json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function updateClient(req, res) {
  const { name, phone, email, notes } = req.body
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || null)
      .input('email', sql.NVarChar, email || null)
      .input('notes', sql.NVarChar, notes || null)
      .query(`UPDATE clients SET name=@name, phone=@phone, email=@email, notes=@notes
              OUTPUT INSERTED.* WHERE id=@id AND business_id=@businessId`)
    if (result.recordset.length === 0) return res.status(404).json({ error: 'לקוח לא נמצא' })
    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function deleteClient(req, res) {
  try {
    const pool = await getPool()
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query('DELETE FROM clients WHERE id=@id AND business_id=@businessId')
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { getClients, getClient, createClient, updateClient, deleteClient }
