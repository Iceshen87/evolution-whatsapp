const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Deep debugging...\n');
    
    // 检查所有容器状态
    conn.exec('docker ps -a', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查 Evolution API 完整日志:');
            conn.exec('docker logs evolution-whatsapp-evolution-api-1 2>&1 | tail -50', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n检查端口监听状态:');
                    conn.exec('netstat -tlnp | grep 8080', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n测试从宿主机访问:');
                            conn.exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/manager/', (err, stream) => {
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
