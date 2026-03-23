import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { evolutionService } from '../services/evolution';

export const instancesRouter = Router();

// All routes require authentication
instancesRouter.use(authenticate);

// GET /api/web/instances - List instances
instancesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    // Admin sees all, user sees only their own
    const where = user.role === 'admin' ? {} : { id: user.userId };
    const users = await prisma.user.findMany({
      where: { ...where, instanceName: { not: null } },
      select: { id: true, username: true, instanceName: true },
    });

    // Fetch live status from Evolution API for each instance
    const instances = await Promise.all(
      users.map(async (u) => {
        let status = 'unknown';
        let phoneNumber: string | null = null;
        try {
          const state = await evolutionService.getConnectionState(u.instanceName!);
          status = state?.instance?.state || state?.state || 'unknown';
        } catch {
          status = 'disconnected';
        }
        try {
          const info = await evolutionService.getInstanceInfo(u.instanceName!);
          if (Array.isArray(info) && info.length > 0) {
            phoneNumber = info[0]?.instance?.owner || null;
          }
        } catch {
          // ignore
        }
        return {
          instanceName: u.instanceName,
          ownerUsername: u.username,
          ownerId: u.id,
          status,
          phoneNumber,
        };
      })
    );

    res.json({ instances });
  } catch (err) {
    console.error('[Instances] List error:', err);
    res.status(500).json({ error: 'Failed to list instances' });
  }
});

// POST /api/web/instances - Create instance
instancesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { instanceName } = req.body;

    if (!instanceName || typeof instanceName !== 'string') {
      res.status(400).json({ error: 'instanceName is required' });
      return;
    }

    // Sanitize instance name: only allow alphanumeric, dash, underscore
    const sanitized = instanceName.replace(/[^a-zA-Z0-9_-]/g, '');
    if (sanitized.length < 2 || sanitized.length > 50) {
      res.status(400).json({ error: 'instanceName must be 2-50 alphanumeric characters' });
      return;
    }

    // Check if user already has an instance (non-admin)
    if (user.role !== 'admin') {
      const existing = await prisma.user.findUnique({ where: { id: user.userId } });
      if (existing?.instanceName) {
        res.status(409).json({ error: 'You already have an instance assigned' });
        return;
      }
    }

    // Create on Evolution API
    const result = await evolutionService.createInstance(sanitized);

    // Save instance name to user
    await prisma.user.update({
      where: { id: user.userId },
      data: { instanceName: sanitized },
    });

    res.status(201).json({
      instanceName: sanitized,
      evolution: result,
    });
  } catch (err: any) {
    console.error('[Instances] Create error:', err?.response?.data || err.message);
    if (err?.response?.status === 403) {
      res.status(409).json({ error: 'Instance name already exists in Evolution API' });
      return;
    }
    res.status(500).json({ error: 'Failed to create instance' });
  }
});

// GET /api/web/instances/:name/qr - Get QR code
instancesRouter.get('/:name/qr', async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.params.name);
    const user = req.user!;

    // Authorization: user can only access their own instance
    if (user.role !== 'admin') {
      const owner = await prisma.user.findUnique({ where: { id: user.userId } });
      if (owner?.instanceName !== name) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    const result = await evolutionService.getQRCode(name);
    res.json(result);
  } catch (err: any) {
    console.error('[Instances] QR error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get QR code' });
  }
});

// GET /api/web/instances/:name/status - Connection status
instancesRouter.get('/:name/status', async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.params.name);
    const user = req.user!;

    if (user.role !== 'admin') {
      const owner = await prisma.user.findUnique({ where: { id: user.userId } });
      if (owner?.instanceName !== name) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    const result = await evolutionService.getConnectionState(name);
    res.json(result);
  } catch (err: any) {
    console.error('[Instances] Status error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// DELETE /api/web/instances/:name - Delete instance
instancesRouter.delete('/:name', async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.params.name);
    const user = req.user!;

    // Find the user who owns this instance
    const owner = await prisma.user.findFirst({ where: { instanceName: name } });
    if (!owner) {
      res.status(404).json({ error: 'Instance not found' });
      return;
    }

    // Only admin or owner can delete
    if (user.role !== 'admin' && user.userId !== owner.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Delete from Evolution API
    try {
      await evolutionService.deleteInstance(name);
    } catch {
      // Continue even if Evolution API fails (instance might already be gone)
    }

    // Remove instance from user
    await prisma.user.update({
      where: { id: owner.id },
      data: { instanceName: null },
    });

    res.json({ message: 'Instance deleted' });
  } catch (err) {
    console.error('[Instances] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete instance' });
  }
});
