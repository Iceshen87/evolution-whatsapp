import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { evolutionService } from '../services/evolution';

export const posRouter = Router();

// ─────────────────────────────────────────────────
// Server 1 format (ai.365ws.com)
// GET /api/pos/create-message?appkey=XXX&authkey=YYY&to=PHONE&message=TEXT
// ─────────────────────────────────────────────────
posRouter.get('/create-message', async (req: Request, res: Response) => {
  try {
    const { appkey, authkey, to, message } = req.query;

    if (!appkey || !authkey) {
      res.status(400).json({ success: false, error: 'Missing appkey or authkey' });
      return;
    }
    if (!to || !message) {
      res.status(400).json({ success: false, error: 'Missing "to" or "message" parameter' });
      return;
    }

    const mapping = await prisma.posMapping.findFirst({
      where: { appkey: String(appkey), authkey: String(authkey) },
      include: { user: { select: { id: true, instanceName: true, isActive: true } } },
    });

    if (!mapping || !mapping.user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    if (!mapping.user.instanceName) {
      res.status(400).json({ success: false, error: 'No WhatsApp instance bound for this account' });
      return;
    }

    const result = await evolutionService.sendText(mapping.user.instanceName, String(to), String(message));

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: { to: String(to), messageId: result?.key?.id || null },
    });
  } catch (err: any) {
    console.error('[POS] create-message error:', err?.response?.data || err.message);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// ─────────────────────────────────────────────────
// Server 2 format (ccs.365ws.com)
// GET /api/pos/send?number=PHONE&type=text&message=TEXT&instance_id=XXX&access_token=YYY
// ─────────────────────────────────────────────────
posRouter.get('/send', async (req: Request, res: Response) => {
  try {
    const { number, type, message, instance_id, access_token } = req.query;

    if (!instance_id || !access_token) {
      res.status(400).json({ success: false, error: 'Missing instance_id or access_token' });
      return;
    }
    if (!number || !message) {
      res.status(400).json({ success: false, error: 'Missing "number" or "message" parameter' });
      return;
    }

    const mapping = await prisma.posMapping.findFirst({
      where: { instanceId: String(instance_id), accessToken: String(access_token) },
      include: { user: { select: { id: true, instanceName: true, isActive: true } } },
    });

    if (!mapping || !mapping.user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    if (!mapping.user.instanceName) {
      res.status(400).json({ success: false, error: 'No WhatsApp instance bound for this account' });
      return;
    }

    // Currently only support type=text; can be extended for media later
    const result = await evolutionService.sendText(mapping.user.instanceName, String(number), String(message));

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: { number: String(number), type: String(type || 'text'), messageId: result?.key?.id || null },
    });
  } catch (err: any) {
    console.error('[POS] send error:', err?.response?.data || err.message);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// ─────────────────────────────────────────────────
// Status check (works with both credential formats)
// ─────────────────────────────────────────────────
posRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const { appkey, authkey, instance_id, access_token } = req.query;

    let mapping;
    if (appkey && authkey) {
      mapping = await prisma.posMapping.findFirst({
        where: { appkey: String(appkey), authkey: String(authkey) },
        include: { user: { select: { instanceName: true, isActive: true } } },
      });
    } else if (instance_id && access_token) {
      mapping = await prisma.posMapping.findFirst({
        where: { instanceId: String(instance_id), accessToken: String(access_token) },
        include: { user: { select: { instanceName: true, isActive: true } } },
      });
    } else {
      res.status(400).json({ success: false, error: 'Missing credentials (appkey+authkey or instance_id+access_token)' });
      return;
    }

    if (!mapping || !mapping.user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    if (!mapping.user.instanceName) {
      res.json({ success: true, status: 'no_instance' });
      return;
    }

    const state = await evolutionService.getConnectionState(mapping.user.instanceName);
    res.json({
      success: true,
      status: state?.instance?.state || state?.state || 'unknown',
      instanceName: mapping.user.instanceName,
    });
  } catch (err: any) {
    console.error('[POS] Status error:', err?.response?.data || err.message);
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});
