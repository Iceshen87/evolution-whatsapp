import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { userModel } from '../models/user.js'
import { authenticate, authorize } from '../middleware/auth.js'

const router = express.Router()

const updateRoleValidation = [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID'),
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either "user" or "admin"')
]

const paginationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be non-negative'),
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Invalid role filter')
]

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    })
  }
  next()
}

router.use(authenticate)

router.get('/users', authorize('admin'), paginationValidation, handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const offset = parseInt(req.query.offset) || 0
    const role = req.query.role || null

    const users = await userModel.findAll({ limit, offset, role })
    const total = await userModel.count(role)

    res.json({
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
        lastLoginAt: u.last_login_at
      })),
      pagination: {
        total,
        limit,
        offset
      }
    })
  } catch (err) {
    console.error('Get users error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.put('/users/:id/role', authorize('admin'), updateRoleValidation, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    const user = await userModel.findById(parseInt(id))
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' })
    }

    const updated = await userModel.updateRole(parseInt(id), role)

    res.json({
      message: 'User role updated successfully',
      user: updated
    })
  } catch (err) {
    console.error('Update user role error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.delete('/users/:id', authorize('admin'), [
  param('id').isInt({ min: 1 }).withMessage('Invalid user ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params

    const user = await userModel.findById(parseInt(id))
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' })
    }

    await userModel.deleteById(parseInt(id))

    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.get('/stats', authorize('admin'), async (_req, res) => {
  try {
    const total = await userModel.count()
    const admins = await userModel.count('admin')
    const regularUsers = await userModel.count('user')

    res.json({
      stats: {
        total,
        admins,
        regularUsers
      }
    })
  } catch (err) {
    console.error('Get stats error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
