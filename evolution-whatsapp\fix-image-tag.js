const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 修复镜像标签 ===\n');
    
    const cmd = `
docker tag atendai/evolution-api:v1.8.0 atendai/evolution-api:latest &&
cd /opt/evolution-whatsapp &&
docker compose stop evolution-api &&
docker rm evolution-whatsapp-evolution-api-1 &&
docker compose up -d evolution-api
echo "Done"
`;
    
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n等待 30 秒...');
            setTimeout(() => {
                console.log('\n检查版本:');
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
