const { Client } = require('ssh2');

const conn = new Client();

const composeContent = `services:
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
    entrypoint: ["sh", "-c", "cp -r /usr/share/nginx/html/* /output/ && echo 'Frontend files copied'"]
    mem_limit: 128m

  backend:
    build: ./backend
    environment:
      - NODE_ENV=\${NODE_ENV:-production}
      - JWT_SECRET=\${JWT_SECRET}
      - ADMIN_USERNAME=\${ADMIN_USERNAME:-admin}
      - ADMIN_PASSWORD=\${ADMIN_PASSWORD}
      - EVOLUTION_API_URL=http://evolution-api:8080
      - EVOLUTION_API_KEY=\${EVOLUTION_API_KEY}
      - PORT=\${BACKEND_PORT:-3000}
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
    image: atendai/evolution-api:latest
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://8.222.170.254:8080
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=\${EVOLUTION_API_KEY}
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}?schema=public
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379
      - CACHE_LOCAL_ENABLED=false
      - LOG_LEVEL=ERROR
      - DEL_INSTANCE=false
      - CONFIG_SESSION_PHONE_CLIENT=Evolution API
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
      - POSTGRES_DB=\${POSTGRES_DB:-evolution}
      - POSTGRES_USER=\${POSTGRES_USER:-evolution}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    command: >
      postgres
      -c shared_buffers=64MB
      -c effective_cache_size=128MB
      -c maintenance_work_mem=16MB
      -c work_mem=4MB
      -c max_connections=50
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
`;

conn.on('ready', () => {
    console.log('=== 重写 docker-compose.yml ===\n');
    
    // 写入新配置
    conn.exec(`cat > /opt/evolution-whatsapp/docker-compose.light.yml << 'ENDOFFILE'
${composeContent}
ENDOFFILE`, (err, stream) => {
        if (err) { console.error('Error:', err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n验证配置...');
            conn.exec('grep -A3 "evolution-api:" /opt/evolution-whatsapp/docker-compose.light.yml', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n重启所有服务...');
                    conn.exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml down && docker compose -f docker-compose.light.yml up -d', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n等待 30 秒启动...');
                            setTimeout(() => {
                                console.log('\n检查端口:');
                                conn.exec('netstat -tlnp | grep 8080', (err, stream) => {
                                    stream.on('data', d => process.stdout.write(d.toString()));
                                    stream.on('close', () => {
                                        console.log('\n测试 API:');
                                        conn.exec('docker exec evolution-whatsapp-backend-1 node -e "const http=require(\\'http\\');http.get(\\'http://evolution-api:8080\\',res=>{let d=\\'\\';res.on(\\'data\\',c=>d+=c);res.on(\\'end\\',()=>console.log(\\'API:\\',res.statusCode,d.substring(0,50)));}).on(\\'error\\',e=>console.log(e.message));setTimeout(()=>process.exit(0),3000);"', (err, stream) => {
                                            stream.on('data', d => process.stdout.write(d.toString()));
                                            stream.on('close', () => {
                                                console.log('\n=== 完成 ===');
                                                console.log('访问 Manager: http://8.222.170.254:8080/manager');
                                                console.log('API Key: 684de76250938ef254f136318374608b');
                                                conn.end();
                                            });
                                        });
                                    });
                                });
                            }, 30000);
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', err => {
    console.error('SSH Error:', err.message);
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
