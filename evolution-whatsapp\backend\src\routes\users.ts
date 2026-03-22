import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { evolutionService } from '../services/evolution';

export const usersRouter = Router();

// All routes require admin
usersRouter.use(authenticate, requireAdmin);

// GET /api/web/users - List all users
usersRouter.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        instanceName: true,
        createdAt: true,
        posMapping: {
          select: { appkey: true, authkey: true, instanceId: true, accessToken: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (err) {
    console.error('[Users] List error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// POST /api/web/users - Create user + instance + POS keys
usersRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (username.length < 2 || username.length > 50) {
      res.status(400).json({ error: 'Username must be 2-50 characters' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Check if username exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'admin' ? 'admin' : 'user';

    // Generate POS keys (Server 1: appkey + authkey)
    const appkey = uuidv4().replace(/-/g, '');
    const authkey = uuidv4().replace(/-/g, '');
    // Generate POS keys (Server 2: instanceId + accessToken)
    const instanceId = uuidv4().replace(/-/g, '').substring(0, 13).toUpperCase();
    const accessToken = uuidv4().replace(/-/g, '').substring(0, 13);

    // Create instance name from username
    const instanceName = `inst_${username.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Create user with POS mapping
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: userRole,
        instanceName,
        posMapping: {
          create: { appkey, authkey, instanceId, accessToken },
        },
      },
      select: {
        id: true,
        username: true,
        role: true,
        instanceName: true,
        createdAt: true,
        posMapping: {
          select: { appkey: true, authkey: true, instanceId: true, accessToken: true },
        },
      },
    });

    // Create instance on Evolution API
    try {
      await evolutionService.createInstance(instanceName);
    } catch (err: any) {
      console.error('[Users] Evolution instance creation warning:', err?.response?.data || err.message);
      // Don't fail user creation if Evolution is not reachable
    }

    res.status(201).json({ user });
  } catch (err) {
    console.error('[Users] Create error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/web/users/:id - Update user
usersRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const { password, isActive, role } = req.body;

    const updateData: any = {};
    if (password) {
      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (role === 'admin' || role === 'user') {
      updateData.role = role;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        instanceName: true,
      },
    });

    res.json({ user });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    console.error('[Users] Update error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/web/users/:id - Deactivate user
usersRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Don't allow deleting yourself
    if (user.id === req.user!.userId) {
      res.status(400).json({ error: 'Cannot deactivate yourself' });
      return;
    }

    // Delete Evolution instance if exists
    if (user.instanceName) {
      try {
        await evolutionService.deleteInstance(user.instanceName);
      } catch {
        // Continue even if Evolution API fails
      }
    }

    // Deactivate user (soft delete)
    await prisma.user.update({
      where: { id },
      data: { isActive: false, instanceName: null },
    });

    res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error('[Users] Delete error:', err);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});
