const { getPool, sql } = require('../config/db')

async function getServices(req, res) {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query('SELECT * FROM services WHERE business_id = @businessId ORDER BY created_at DESC')
    res.json(result.recordset)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function createService(req, res) {
  const { name, duration_minutes, price, color } = req.body
  if (!name || !duration_minutes) {
    return res.status(400).json({ error: 'שם ומשך הם חובה' })
  }
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('name', sql.NVarChar, name)
      .input('duration', sql.Int, duration_minutes)
      .input('price', sql.Decimal(10,2), price || null)
      .input('color', sql.NVarChar, color || '#C2185B')
      .query(`
        INSERT INTO services (business_id, name, duration_minutes, price, color)
        OUTPUT INSERTED.*
        VALUES (@businessId, @name, @duration, @price, @color)
      `)
    res.status(201).json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function updateService(req, res) {
  const { name, duration_minutes, price, color, is_active } = req.body
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .input('name', sql.NVarChar, name)
      .input('duration', sql.Int, duration_minutes)
      .input('price', sql.Decimal(10,2), price || null)
      .input('color', sql.NVarChar, color || '#C2185B')
      .input('isActive', sql.Bit, is_active !== undefined ? is_active : 1)
      .query(`
        UPDATE services
        SET name=@name, duration_minutes=@duration, price=@price, color=@color, is_active=@isActive
        OUTPUT INSERTED.*
        WHERE id=@id AND business_id=@businessId
      `)
    if (result.recordset.length === 0) return res.status(404).json({ error: 'שירות לא נמצא' })
    res.json(result.recordset[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function deleteService(req, res) {
  try {
    const pool = await getPool()
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('businessId', sql.UniqueIdentifier, req.user.businessId)
      .query('DELETE FROM services WHERE id=@id AND business_id=@businessId')
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { getServices, createService, updateService, deleteService }
