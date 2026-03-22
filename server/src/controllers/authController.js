const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { getPool, sql } = require('../config/db')

async function register(req, res) {
  const { businessName, name, email, password, phone } = req.body
  if (!businessName || !name || !email || !password) {
    return res.status(400).json({ error: 'כל השדות הם חובה' })
  }
  try {
    const pool = await getPool()
    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE email = @email')
    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'אימייל כבר קיים במערכת' })
    }
    const slug = businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4)
    const businessResult = await pool.request()
      .input('name', sql.NVarChar, businessName)
      .input('slug', sql.NVarChar, slug)
      .input('phone', sql.NVarChar, phone || null)
      .query('INSERT INTO businesses (name, slug, phone) OUTPUT INSERTED.id VALUES (@name, @slug, @phone)')
    const businessId = businessResult.recordset[0].id
    const passwordHash = await bcrypt.hash(password, 12)
    const userResult = await pool.request()
      .input('businessId', sql.UniqueIdentifier, businessId)
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone || null)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query('INSERT INTO users (business_id, name, email, phone, password_hash, role) OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role VALUES (@businessId, @name, @email, @phone, @passwordHash, \'owner\')')
    const user = userResult.recordset[0]
    const token = jwt.sign(
      { userId: user.id, businessId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, business: { id: businessId, name: businessName, slug } })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'אימייל וסיסמה הם חובה' })
  }
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT u.id, u.name, u.email, u.role, u.password_hash, u.business_id FROM users u WHERE u.email = @email')
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' })
    }
    const user = result.recordset[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' })
    }
    const token = jwt.sign(
      { userId: user.id, businessId: user.business_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, businessId: user.business_id })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'שגיאת שרת' })
  }
}

module.exports = { register, login }
