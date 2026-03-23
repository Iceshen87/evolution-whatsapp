const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 直接执行修复命令
  const fixCmd = `cat > /opt/evolution-whatsapp/backend/prisma/schema.prisma << 'SCHEMA_EOF'
datasource db {
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
}
SCHEMA_EOF`;

  conn.exec(fixCmd, (err, stream) => {
    if (err) {
      console.error('Error:', err);
      conn.end();
      return;
    }
    stream.on('close', () => {
      console.log('Schema file created');
      
      // 重启后端
      conn.exec('docker restart evolution-whatsapp-backend-1', (err, stream) => {
        if (err) {
          console.error('Restart error:', err);
          conn.end();
          return;
        }
        stream.on('close', () => {
          console.log('Backend restarted, waiting 15 seconds...');
          
          // 等待并测试
          setTimeout(() => {
            conn.exec('curl -s http://localhost:3000/api/pos/stats', (err, stream) => {
              let result = '';
              stream.on('data', d => result += d);
              stream.on('close', () => {
                console.log('API Test result:', result || 'No response');
                conn.end();
              });
            });
          }, 15000);
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err.message);
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358',
  readyTimeout: 30000
});
