const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected');
  
  // 直接在容器内创建 schema 文件
  const schema = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           Int          @id @default(autoincrement())
  username     String       @unique
  passwordHash String
  role         String       @default("user")
  isActive     Boolean      @default(true)
  instanceName String?      @unique
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  posMapping   PosMapping?
  MessageLog   MessageLog[]
}

model PosMapping {
  id          Int    @id @default(autoincrement())
  appkey      String @unique
  authkey     String @unique
  instanceId  String @unique
  accessToken String @unique
  userId      Int    @unique
  user        User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model MessageLog {
  id           Int      @id @default(autoincrement())
  userId       Int
  username     String
  instanceName String
  to           String
  message      String
  messageId    String?
  status       String
  error        String?
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([createdAt])
  @@index([username])
}`;

  const b64 = Buffer.from(schema).toString('base64');
  const cmd = `docker exec evolution-whatsapp-backend-1 sh -c "echo '${b64}' | base64 -d > /app/prisma/schema.prisma && cat /app/prisma/schema.prisma | head -5"`;
  
  conn.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => {
      console.log('\nSchema updated in container');
      
      // 重启
      conn.exec('docker restart evolution-whatsapp-backend-1', (err, stream) => {
        stream.on('close', () => {
          console.log('Restarted');
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
