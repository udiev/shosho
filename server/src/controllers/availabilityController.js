const { getPool, sql } = require('../config/db')

async function ensureTable(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'availability_slots')
    CREATE TABLE availability_slots (
      id INT IDENTITY PRIMARY KEY,
      business_id UNIQUEIDENTIFIER NOT NULL,
      date DATE NOT NULL,
      start_time VARCHAR(5) NOT NULL,
      end_time VARCHAR(5) NOT NULL
    )
  `)
}

async function getAvailability(req, res) {
  try {
    const pool = await getPool()
    await ensureTable(pool)
    const from = req.query.from || new Date().toISOString().slice(0, 10)
    const to = req.query.to || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)
    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('from', sql.Date, from)
      .input('to', sql.Date, to)
      .query(`
        SELECT id, CONVERT(VARCHAR(10), date, 23) as date, start_time, end_time
        FROM availability_slots
        WHERE business_id = @businessId AND date >= @from AND date <= @to
        ORDER BY date, start_time
      `)
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function createAvailability(req, res) {
  const { date, start_time, end_time } = req.body
  if (!date || !start_time || !end_time) return res.status(400).json({ error: 'חסרים פרטים' })
  try {
    const pool = await getPool()
    await ensureTable(pool)
    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('date', sql.Date, date)
      .input('startTime', sql.VarChar(5), start_time)
      .input('endTime', sql.VarChar(5), end_time)
      .query(`
        INSERT INTO availability_slots (business_id, date, start_time, end_time)
        OUTPUT INSERTED.id, CONVERT(VARCHAR(10), INSERTED.date, 23) as date,
               INSERTED.start_time, INSERTED.end_time
        VALUES (@businessId, @date, @startTime, @endTime)
      `)
    res.status(201).json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function deleteAvailability(req, res) {
  try {
    const pool = await getPool()
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query('DELETE FROM availability_slots WHERE id = @id AND business_id = @businessId')
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { getAvailability, createAvailability, deleteAvailability }
