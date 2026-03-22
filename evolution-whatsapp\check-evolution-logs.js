const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查 Evolution API 日志 ===\n');
    
    conn.exec('docker logs --tail=50 evolution-whatsapp-evolution-api-1 2>&1', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查 QR 码生成:');
            conn.exec('curl -s http://localhost:8080/instance/connect/123 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
