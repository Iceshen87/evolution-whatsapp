const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查 QR 码获取失败原因 ===\n');
    
    // 检查实例 123 在 Evolution API 中的状态
    conn.exec('curl -s http://localhost:8080/instance/fetchInstances -H "apikey: 684de76250938ef254f136318374608b" | grep -A5 "123"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查后端日志:');
            conn.exec('docker logs --tail=20 evolution-whatsapp-backend-1', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n测试直接获取 QR 码:');
                    conn.exec('curl -s http://localhost:8080/instance/connect/123 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            conn.end();
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
