const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 重新创建实例 ===\n');
    
    // 1. 删除所有旧实例
    console.log('1. 删除旧实例...');
    conn.exec('curl -s -X DELETE "http://localhost:8080/instance/delete/123" -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n2. 创建新实例...');
            conn.exec('curl -s -X POST "http://localhost:8080/instance/create" -H "apikey: 684de76250938ef254f136318374608b" -H "Content-Type: application/json" -d \'{"instanceName":"123","integration":"WHATSAPP-BAILEYS","qrcode":true}\'', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n3. 等待 5 秒后获取 QR 码...');
                    setTimeout(() => {
                        conn.exec('curl -s "http://localhost:8080/instance/connect/123" -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                            stream.on('data', d => process.stdout.write(d.toString()));
                            stream.on('close', () => {
                                console.log('\n=== 完成 ===');
                                console.log('请刷新 Manager 页面查看 QR 码');
                                conn.end();
                            });
                        });
                    }, 5000);
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
