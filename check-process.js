const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Checking if Evolution API is running...\n');
    
    // 检查进程
    conn.exec('docker exec evolution-whatsapp-evolution-api-1 ps aux', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查端口是否在容器内监听:');
            conn.exec('docker exec evolution-whatsapp-evolution-api-1 netstat -tlnp 2>/dev/null || ss -tlnp', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n重启 Evolution API:');
                    conn.exec('docker restart evolution-whatsapp-evolution-api-1 && sleep 20 && docker logs --tail=10 evolution-whatsapp-evolution-api-1', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n再次测试:');
                            conn.exec('curl -s http://localhost:8080/manager/ | head -5', (err, stream) => {
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
