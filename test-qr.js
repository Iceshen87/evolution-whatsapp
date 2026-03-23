const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 测试 QR 码获取 ===\n');
    
    conn.exec('curl -s "http://localhost:8080/instance/connect/123" -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查实例状态:');
            conn.exec('curl -s "http://localhost:8080/instance/connectionState/123" -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
