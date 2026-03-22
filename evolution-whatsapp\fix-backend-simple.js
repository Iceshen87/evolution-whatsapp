const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('查看当前 backend 配置...');
    
    conn.exec('grep -A5 "backend:" /opt/evolution-whatsapp/docker-compose.yml | head -10', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n在 backend 部分添加 command...');
            
            // 使用 printf 来处理特殊字符
            const cmd = 'sed -i "/^  backend:/,/build:/{s/build: \\.\\//command: [\\"sh\\\", \\"-c\\\", \\"npx prisma db push --skip-generate \\&\\& node dist/main.js\\\"],\\n    build: ./}" /opt/evolution-whatsapp/docker-compose.yml';
            
            conn.exec(cmd, (err, stream) => {
                stream.on('close', () => {
                    console.log('已添加 command');
                    
                    // 验证
                    conn.exec('grep -A8 "backend:" /opt/evolution-whatsapp/docker-compose.yml | head -15', (err, stream) => {
                        stream.on('data', (d) => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n重新创建 backend 容器...');
                            conn.exec('cd /opt/evolution-whatsapp && docker compose up -d backend', (err, stream) => {
                                stream.on('data', (d) => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    setTimeout(() => {
                                        conn.exec('docker logs --tail=5 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
                                            stream.on('data', (d) => process.stdout.write(d.toString()));
                                            stream.on('close', () => conn.end());
                                        });
                                    }, 10000);
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
