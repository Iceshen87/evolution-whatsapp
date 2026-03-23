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
// POST /api/pos/send (with form data or JSON body)
// ─────────────────────────────────────────────────
posRouter.get('/send', handleSend);
posRouter.post('/send', handleSend);

async function handleSend(req: Request, res: Response) {
  try {
    // Support both GET (query) and POST (body)
    const data = req.method === 'POST' ? req.body : req.query;
    const { number, type, message, instance_id, access_token } = data;

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
    let result;
    let status = 'sent';
    let messageId = null;
    let errorMsg = null;
    
    try {
      result = await evolutionService.sendText(mapping.user.instanceName, String(number), String(message));
      messageId = result?.key?.id || null;
    } catch (sendErr: any) {
      status = 'failed';
      errorMsg = sendErr?.response?.data?.message || sendErr.message;
      console.error('[POS] Send failed:', errorMsg);
    }
    
    // Log the message
    try {
      await prisma.messageLog.create({
        data: {
          userId: mapping.user.id,
          username: mapping.user.instanceName || 'unknown',
          instanceName: mapping.user.instanceName || 'unknown',
          to: String(number),
          message: String(message).substring(0, 500), // Limit length
          messageId: messageId,
          status: status,
          error: errorMsg,
        },
      });
    } catch (logErr) {
      console.error('[POS] Failed to log message:', logErr);
    }

    if (status === 'failed') {
      res.status(500).json({ success: false, error: 'Failed to send message', details: errorMsg });
      return;
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: { number: String(number), type: String(type || 'text'), messageId: messageId },
    });
  } catch (err: any) {
    console.error('[POS] send error:', err?.response?.data || err.message);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
}

// ─────────────────────────────────────────────────
// Get message logs (admin only)
// GET /api/pos/logs?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&userId=XXX
// ─────────────────────────────────────────────────
posRouter.get('/logs', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId, username, limit = '100' } = req.query;
    
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate) + 'T23:59:59');
    }
    
    if (userId) where.userId = parseInt(String(userId), 10);
    if (username) where.username = String(username);
    
    const logs = await prisma.messageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(String(limit), 10),
    });
    
    // Calculate statistics
    const stats = {
      total: logs.length,
      sent: logs.filter(l => l.status === 'sent').length,
      failed: logs.filter(l => l.status === 'failed').length,
    };
    
    res.json({
      success: true,
      data: { logs, stats },
    });
  } catch (err: any) {
    console.error('[POS] Logs error:', err?.message);
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

// ─────────────────────────────────────────────────
// Get message statistics per user
// GET /api/pos/stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// ─────────────────────────────────────────────────
posRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate) + 'T23:59:59');
    }
    
    // Group by user
    const userStats = await prisma.messageLog.groupBy({
      by: ['userId', 'username'],
      where,
      _count: {
        id: true,
      },
    });
    
    // Get detailed stats per user
    const detailedStats = await Promise.all(
      userStats.map(async (stat: any) => {
        const sent = await prisma.messageLog.count({
          where: { ...where, userId: stat.userId, status: 'sent' },
        });
        const failed = await prisma.messageLog.count({
          where: { ...where, userId: stat.userId, status: 'failed' },
        });
        return {
          userId: stat.userId,
          username: stat.username,
          total: stat._count.id,
          sent,
          failed,
        };
      })
    );
    
    res.json({
      success: true,
      data: detailedStats,
    });
  } catch (err: any) {
    console.error('[POS] Stats error:', err?.message);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
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
