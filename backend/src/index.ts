import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { authRouter } from './routes/auth';
import { instancesRouter } from './routes/instances';
import { usersRouter } from './routes/users';
import { posRouter } from './routes/pos';

export const prisma = new PrismaClient();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/web/auth', authRouter);
app.use('/api/web/instances', instancesRouter);
app.use('/api/web/users', usersRouter);
app.use('/api/pos', posRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

async function seedAdmin() {
  const existing = await prisma.user.findUnique({
    where: { username: config.adminUsername },
  });
  if (!existing) {
    const hash = await bcrypt.hash(config.adminPassword, 10);
    await prisma.user.create({
      data: {
        username: config.adminUsername,
        passwordHash: hash,
        role: 'admin',
      },
    });
    console.log(`[Seed] Admin user "${config.adminUsername}" created`);
  }
}

async function main() {
  await seedAdmin();
  app.listen(config.port, () => {
    console.log(`[Server] Running on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
