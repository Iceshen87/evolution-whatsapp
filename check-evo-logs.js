const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== Evolution API 最近日志 ===\n');
    
    conn.exec('docker logs --tail=100 evolution-whatsapp-evolution-api-1 2>&1 | grep -E "(create|error|Error|test_1)" | tail -30', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n=== 检查 Evolution API 进程 ===');
            conn.exec('docker top evolution-whatsapp-evolution-api-1', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
});

conn.on('error', (err) => console.error('Error:', err.message));

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
