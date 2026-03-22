const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 回滚到 v2.2.3 ===\n');
    
    const cmd = `
cd /opt/evolution-whatsapp &&
docker compose down &&
sed -i 's|atendai/evolution-api:v1.8.0|atendai/evolution-api:latest|g' docker-compose.light.yml &&
docker pull atendai/evolution-api:latest &&
docker compose up -d
echo "Done"
`;
    
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n等待 30 秒...');
            setTimeout(() => {
                console.log('\n检查:');
                conn.exec('curl -s http://localhost:8080', (err, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => conn.end());
                });
            }, 30000);
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
