const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 测试 v1.8.0 API ===\n');
    
    conn.exec('curl -s http://localhost:8080', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查日志:');
            conn.exec('docker logs --tail=10 evolution-whatsapp-evolution-api-1', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
