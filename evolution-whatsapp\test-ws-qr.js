const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 测试 WebSocket QR 码获取 ===\n');
    
    // 检查后端日志
    conn.exec('docker logs --tail=30 evolution-whatsapp-backend-1', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n\n测试 QR 码接口...');
            
            // 测试 QR 码接口
            conn.exec('curl -s http://localhost:3000/api/web/instances/test_1/qr -H "Authorization: Bearer $(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"Admin@20260321"}\' | grep -o \'"token":"[^"]*\' | cut -d\'"\' -f4)"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n完成');
                    conn.end();
                });
            });
        });
    });
});

conn.on('error', err => {
    console.error('SSH Error:', err.message);
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
