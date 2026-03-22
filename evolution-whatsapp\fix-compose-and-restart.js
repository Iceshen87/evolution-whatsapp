const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('1. 修改 docker-compose.yml...');
    
    // 添加 command 到 backend
    conn.exec('cd /opt/evolution-whatsapp && sed -i "/build: .\\/backend/a\\    command: sh -c \\"npx prisma db push --skip-generate \\&\\& node dist/main.js\\"" docker-compose.yml', (err, stream) => {
        stream.on('close', () => {
            console.log('2. 修改 evolution-api 镜像版本...');
            conn.exec('sed -i "s|atendai/evolution-api:latest|atendai/evolution-api:v1.8.7|g" /opt/evolution-whatsapp/docker-compose.yml', (err, stream) => {
                stream.on('close', () => {
                    console.log('3. 添加端口映射...');
                    conn.exec('sed -i "/image: atendai\\/evolution-api:v1.8.7/a\\    ports:\\n      - \\"8080:8080\\"" /opt/evolution-whatsapp/docker-compose.yml', (err, stream) => {
                        stream.on('close', () => {
                            console.log('4. 验证配置...');
                            conn.exec('grep -A2 "evolution-api:" /opt/evolution-whatsapp/docker-compose.yml | head -10', (err, stream) => {
                                stream.on('data', (d) => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n5. 重启服务...');
                                    conn.exec('cd /opt/evolution-whatsapp && docker compose stop backend && docker rm -f evolution-whatsapp-backend-1 && docker compose up -d backend', (err, stream) => {
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
    });
});

conn.on('error', (err) => console.error(err.message));
conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
