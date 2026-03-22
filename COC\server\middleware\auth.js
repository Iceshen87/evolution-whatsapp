import jwt from 'jsonwebtoken'
import { userModel } from '../models/user.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

export function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

export function authenticate(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required', code: 'TOKEN_MISSING' })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token', code: 'TOKEN_INVALID' })
  }

  if (decoded.type === 'refresh') {
    return res.status(401).json({ message: 'Invalid token type', code: 'INVALID_TOKEN_TYPE' })
  }

  req.user = decoded
  next()
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated', code: 'NOT_AUTHENTICATED' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions', code: 'FORBIDDEN' })
    }

    next()
  }
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    const decoded = verifyToken(token)
    if (decoded && decoded.type !== 'refresh') {
      req.user = decoded
    }
  }

  next()
}

export { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN }
