const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查 v1.8.7 状态 ===\n');
    
    conn.exec('docker ps | grep evolution-api', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查版本:');
            conn.exec('curl -s http://localhost:8080', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
