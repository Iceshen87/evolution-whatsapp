const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 添加环境变量并重启 ===\n');
    
    // 更新 docker-compose.yml 添加更多配置
    conn.exec(`cat > /tmp/evolution-config.txt << 'EOF'
  evolution-api:
    image: atendai/evolution-api:latest
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://8.222.170.254:8080
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=684de76250938ef254f136318374608b
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evolution:Evo@2026@postgres:5432/evolution?schema=public
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379
      - CACHE_LOCAL_ENABLED=false
      - LOG_LEVEL=ERROR
      - DEL_INSTANCE=false
      - CONFIG_SESSION_PHONE_CLIENT=Evolution API
      - QR_CODE_LIMIT=10
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network
    mem_limit: 512m
    cpus: 0.5
EOF
cat /tmp/evolution-config.txt`, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            // 使用 sed 更新 docker-compose.yml
            console.log('\n更新配置...');
            conn.exec(`cd /opt/evolution-whatsapp && \\
sed -i 's/LOG_LEVEL=WARN/LOG_LEVEL=ERROR/' docker-compose.light.yml && \\
sed -i 's|SERVER_URL=\${EVOLUTION_SERVER_URL:-http://localhost:8080}|SERVER_URL=http://8.222.170.254:8080|' docker-compose.light.yml && \\
echo "配置已更新"`, (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    // 重启 Evolution API
                    console.log('\n重启 Evolution API...');
                    conn.exec('docker restart evolution-whatsapp-evolution-api-1', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n等待 15 秒...');
                            setTimeout(() => {
                                console.log('\n检查状态:');
                                conn.exec('docker ps | grep evolution', (err, stream) => {
                                    stream.on('data', d => process.stdout.write(d.toString()));
                                    stream.on('close', () => {
                                        console.log('\n=== 完成 ===');
                                        console.log('请重新尝试绑定 WhatsApp');
                                        conn.end();
                                    });
                                });
                            }, 15000);
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
