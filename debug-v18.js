const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 调试 v1.8.0 ===\n');
    
    conn.exec('docker logs evolution-whatsapp-evolution-api-1 2>&1', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查进程:');
            conn.exec('docker exec evolution-whatsapp-evolution-api-1 ps aux 2>&1 || echo "Not ready"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
