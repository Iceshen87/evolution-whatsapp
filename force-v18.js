const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 强制部署 v1.8.0 ===\n');
    
    // 直接执行所有命令
    const cmd = `
cd /opt/evolution-whatsapp &&
docker compose down &&
docker rmi atendai/evolution-api:latest 2>/dev/null;
sed -i 's|atendai/evolution-api:latest|atendai/evolution-api:v1.8.0|g' docker-compose.light.yml &&
docker pull atendai/evolution-api:v1.8.0 &&
docker compose up -d
echo "Done"
`;
    
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n等待 40 秒...');
            setTimeout(() => {
                console.log('\n检查:');
                conn.exec('docker ps | grep evolution-api && docker images | grep evolution-api', (err, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => conn.end());
                });
            }, 40000);
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
