const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 手动降级 Evolution API ===\n');
    
    // 直接修改配置
    conn.exec('cat > /opt/evolution-whatsapp/docker-compose.light.yml << \'EOF\'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - frontend-build:/usr/share/nginx/html:ro
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network
    mem_limit: 64m
    cpus: 0.1

  frontend:
    build: ./frontend
    volumes:
      - frontend-build:/output
    entrypoint: ["sh", "-c", "cp -r /usr/share/nginx/html/* /output/"]
    mem_limit: 128m

  backend:
    build: ./backend
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - EVOLUTION_API_URL=http://evolution-api:8080
      - EVOLUTION_API_KEY=${EVOLUTION_API_KEY}
      - PORT=${BACKEND_PORT:-3000}
      - DATABASE_URL=file:/app/data/app.db
    volumes:
      - backend-data:/app/data
    depends_on:
      - evolution-api
    restart: unless-stopped
    networks:
      - app-network
    mem_limit: 256m
    cpus: 0.3
    command: sh -c "npx prisma db push && npm start"

  evolution-api:
    image: atendai/evolution-api:v1.8.0
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://8.222.170.254:8080
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379
      - CACHE_LOCAL_ENABLED=false
      - LOG_LEVEL=ERROR
      - DEL_INSTANCE=false
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network
    mem_limit: 512m
    cpus: 0.5

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB:-evolution}
      - POSTGRES_USER=${POSTGRES_USER:-evolution}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    command: postgres -c shared_buffers=64MB -c effective_cache_size=128MB -c maintenance_work_mem=16MB -c work_mem=4MB -c max_connections=50
    restart: unless-stopped
    networks:
      - app-network
    mem_limit: 256m
    cpus: 0.2

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    command: redis-server --maxmemory 64mb --maxmemory-policy allkeys-lru
    restart: unless-stopped
    networks:
      - app-network
    mem_limit: 128m
    cpus: 0.1

volumes:
  postgres-data:
  redis-data:
  backend-data:
  frontend-build:

networks:
  app-network:
    driver: bridge
EOF', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n配置已更新，停止服务...');
            conn.exec('cd /opt/evolution-whatsapp && docker compose down', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n删除旧镜像...');
                    conn.exec('docker rmi atendai/evolution-api:latest 2>/dev/null; echo done', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n启动 v1.8.0...');
                            conn.exec('cd /opt/evolution-whatsapp && docker compose up -d', (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n等待 40 秒...');
                                    setTimeout(() => {
                                        console.log('\n检查状态:');
                                        conn.exec('docker ps | grep evolution-api', (err, stream) => {
                                            stream.on('data', d => process.stdout.write(d.toString()));
                                            stream.on('close', () => {
                                                console.log('\n测试 API:');
                                                conn.exec('curl -s http://localhost:8080 | head -20', (err, stream) => {
                                                    stream.on('data', d => process.stdout.write(d.toString()));
                                                    stream.on('close', () => {
                                                        conn.end();
                                                    });
                                                });
                                            });
                                        });
                                    }, 40000);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
