import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// POST /api/web/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        instanceName: user.instanceName,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/web/auth/refresh
authRouter.post('/refresh', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const token = jwt.sign(
      { userId: user.userId, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    res.json({ token });
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// GET /api/web/auth/me
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, role: true, instanceName: true, isActive: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error('[Auth] Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});
