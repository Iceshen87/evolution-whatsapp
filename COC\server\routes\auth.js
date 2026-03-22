import express from 'express'
import { body, validationResult } from 'express-validator'
import { userModel } from '../models/user.js'
import { generateAccessToken, generateRefreshToken, authenticate } from '../middleware/auth.js'

const router = express.Router()

const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
]

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    const { username, email, password } = req.body

    const existingUser = await userModel.findByUsername(username)
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists', code: 'USERNAME_EXISTS' })
    }

    const existingEmail = await userModel.findByEmail(email)
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered', code: 'EMAIL_EXISTS' })
    }

    const user = await userModel.createUser(username, email, password)

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Registration error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { username, password } = req.body

    const user = await userModel.findByUsername(username)
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' })
    }

    const isValid = await userModel.verifyPassword(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password', code: 'INVALID_CREDENTIALS' })
    }

    await userModel.updateLastLogin(user.id)

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required', code: 'TOKEN_MISSING' })
    }

    const decoded = require('../middleware/auth.js').verifyToken(refreshToken)
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token', code: 'INVALID_TOKEN' })
    }

    const user = await userModel.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: 'User not found', code: 'USER_NOT_FOUND' })
    }

    const newAccessToken = generateAccessToken(user)

    res.json({
      accessToken: newAccessToken
    })
  } catch (err) {
    console.error('Token refresh error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

router.post('/logout', authenticate, (_req, res) => {
  res.json({ message: 'Logged out successfully' })
})

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' })
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
      }
    })
  } catch (err) {
    console.error('Get user error:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
