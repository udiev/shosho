const { getPool, sql } = require('../config/db')

async function getClients(req, res) {
  try {
    const pool = await getPool()
    const search = req.query.search || ''
    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('search', sql.NVarChar, `%${search}%`)
      .query(`
        SELECT c.*,
          (SELECT COUNT(*) FROM appointments a WHERE a.client_id = c.id) as visit_count
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
      .query(`
        INSERT INTO clients (business_id, name, phone, email, notes)
        OUTPUT INSERTED.*
        VALUES (@businessId, @name, @phone, @email, @notes)
      `)
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
      .query(`
        UPDATE clients
        SET name=@name, phone=@phone, email=@email, notes=@notes
        OUTPUT INSERTED.*
        WHERE id=@id AND business_id=@businessId
      `)
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

module.exports = { getClients, createClient, updateClient, deleteClient }
