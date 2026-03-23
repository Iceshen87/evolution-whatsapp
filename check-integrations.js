const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查可用集成 ===\n');
    
    // 检查 Evolution API 文档
    conn.exec('curl -s "http://localhost:8080/" | head -20', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查创建实例的不同方式:');
            // 尝试创建不同集成的实例
            conn.exec('curl -s -X POST "http://localhost:8080/instance/create" -H "apikey: 684de76250938ef254f136318374608b" -H "Content-Type: application/json" -d \'{"instanceName":"test_baileys","integration":"WHATSAPP-BAILEYS","qrcode":true,"integrationDescription":"Baileys native integration"}\'', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n等待 10 秒检查 QR 码...');
                    setTimeout(() => {
                        conn.exec('curl -s "http://localhost:8080/instance/connect/test_baileys" -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                            stream.on('data', d => process.stdout.write(d.toString()));
                            stream.on('close', () => conn.end());
                        });
                    }, 10000);
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
