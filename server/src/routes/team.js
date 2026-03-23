const router = require('express').Router()
const auth = require('../middleware/auth')
const { getTeam, createTeamMember, removeTeamMember } = require('../controllers/teamController')

function requireOwner(req, res, next) {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'פעולה זו מותרת לבעל העסק בלבד' })
  next()
}

router.get('/',     auth, getTeam)
router.post('/',    auth, requireOwner, createTeamMember)
router.delete('/:id', auth, requireOwner, removeTeamMember)

module.exports = router
