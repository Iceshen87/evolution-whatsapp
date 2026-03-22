const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 修复 docker-compose.yml ===\n');
    
    // 在 evolution-api 部分添加 ports
    const cmd = `
cd /opt/evolution-whatsapp &&
sed -i '/^  evolution-api:/a\\    ports:\\n      - "8080:8080"' docker-compose.yml &&
grep -A5 "evolution-api:" docker-compose.yml | head -10
`;
    
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n重新创建容器...');
            conn.exec('cd /opt/evolution-whatsapp && docker compose up -d evolution-api && sleep 20 && docker ps | grep evolution', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n测试 API:');
                    conn.exec('curl -s http://localhost:8080', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => conn.end());
                    });
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
