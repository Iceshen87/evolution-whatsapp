const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 检查端口映射 ===\n');
    
    conn.exec('docker port evolution-whatsapp-evolution-api-1 && echo === && docker exec evolution-whatsapp-evolution-api-1 netstat -tlnp 2>/dev/null || docker exec evolution-whatsapp-evolution-api-1 ss -tlnp', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n=== 测试内部访问 ===');
            conn.exec('docker exec evolution-whatsapp-evolution-api-1 curl -s http://localhost:8080', (err, stream) => {
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
