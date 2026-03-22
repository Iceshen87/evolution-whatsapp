const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查远程 docker-compose ===\n');
    
    conn.exec('grep -A2 "evolution-api:" /opt/evolution-whatsapp/docker-compose.light.yml | head -5', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查镜像 ID:');
            conn.exec('docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}" | grep evolution', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
