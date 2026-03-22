const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 测试 v1.8.6 QR 码 ===\n');
    
    // 1. 创建新实例
    console.log('1. 创建实例...');
    conn.exec('curl -s -X POST "http://localhost:8080/instance/create" -H "apikey: 684de76250938ef254f136318374608b" -H "Content-Type: application/json" -d \'{"instanceName":"test_v186","integration":"WHATSAPP-BAILEYS","qrcode":true}\'', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n2. 等待 5 秒后获取 QR 码...');
            setTimeout(() => {
                conn.exec('curl -s "http://localhost:8080/instance/connect/test_v186" -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                    stream.on('data', (d) => process.stdout.write(d.toString()));
                    stream.on('close', () => conn.end());
                });
            }, 5000);
        });
    });
});

conn.on('error', (err) => console.error(err.message));
conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
