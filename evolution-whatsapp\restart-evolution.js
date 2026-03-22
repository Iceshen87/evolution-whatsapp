const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 重启 Evolution API ===\n');
    
    conn.exec('docker restart evolution-whatsapp-evolution-api-1', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n等待 30 秒启动...');
            setTimeout(() => {
                console.log('\n检查状态:');
                conn.exec('docker logs --tail=10 evolution-whatsapp-evolution-api-1', (err, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => {
                        console.log('\n测试 QR 码:');
                        conn.exec('curl -s http://localhost:8080/instance/connect/123 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                            stream.on('data', d => process.stdout.write(d.toString()));
                            stream.on('close', () => {
                                console.log('\n=== 完成 ===');
                                conn.end();
                            });
                        });
                    });
                });
            }, 30000);
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
