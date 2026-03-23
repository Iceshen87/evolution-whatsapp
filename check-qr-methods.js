const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查所有 QR 码获取方式 ===\n');
    
    // 1. 标准 connect 端点
    console.log('1. /instance/connect/123:');
    conn.exec('curl -s http://localhost:8080/instance/connect/123 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n2. /instance/qrcode/123 (alternative):');
            conn.exec('curl -s http://localhost:8080/instance/qrcode/123 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n3. 检查是否有 pairing code 支持:');
                    conn.exec('curl -s http://localhost:8080/instance/pairingCode/123 -H "apikey: 684de76250938ef254f136318374608b" -X POST', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n4. 查看实例详细信息:');
                            conn.exec('curl -s http://localhost:8080/instance/fetchInstances -H "apikey: 684de76250938ef254f136318374608b" 2>&1 | grep -A2 -B2 "123"', (err, stream) => {
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
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
