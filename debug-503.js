const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 诊断 503 错误 ===\n');
    
    // 检查容器状态
    conn.exec('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查 Evolution API 日志:');
            conn.exec('docker logs --tail=30 evolution-whatsapp-evolution-api-1 2>&1', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n检查端口监听:');
                    conn.exec('ss -tlnp | grep 8080', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n测试本地访问:');
                            conn.exec('curl -v http://localhost:8080/manager 2>&1 | head -20', (err, stream) => {
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
