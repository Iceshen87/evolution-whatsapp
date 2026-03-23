const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 验证 v1.8.0 ===\n');
    
    // 检查容器使用的镜像
    conn.exec('docker inspect evolution-whatsapp-evolution-api-1 | grep -A2 Image', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n测试 API 版本:');
            conn.exec('curl -s http://localhost:8080', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n检查端口:');
                    conn.exec('netstat -tlnp | grep 8080', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => conn.end());
                    });
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
