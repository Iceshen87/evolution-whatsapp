const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('上传修改后的 Dockerfile...');
    
    const dockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p /app/data
ENV DATABASE_URL="file:/app/data/app.db"
EXPOSE 3000
CMD ["node", "dist/index.js"]
`;
    
    const escapedContent = dockerfile.replace(/"/g, '\\\\"').replace(/\\n/g, '\\\\n');
    
    conn.exec(`cat > /tmp/Dockerfile << 'EOFDOCKER'\n${dockerfile}\nEOFDOCKER`, (err, stream) => {
        stream.on('close', () => {
            console.log('复制到 backend 目录...');
            conn.exec('cp /tmp/Dockerfile /opt/evolution-whatsapp/backend/Dockerfile && cat /opt/evolution-whatsapp/backend/Dockerfile | tail -5', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n重新构建 backend 镜像...');
                    conn.exec('cd /opt/evolution-whatsapp && docker compose build backend', (err, stream) => {
                        stream.on('data', (d) => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n重启 backend...');
                            conn.exec('cd /opt/evolution-whatsapp && docker compose up -d backend', (err, stream) => {
                                stream.on('data', (d) => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n等待 15 秒...');
                                    setTimeout(() => {
                                        conn.exec('docker logs --tail=10 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
                                            stream.on('data', (d) => process.stdout.write(d.toString()));
                                            stream.on('close', () => conn.end());
                                        });
                                    }, 15000);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', (err) => console.error(err.message));
conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
