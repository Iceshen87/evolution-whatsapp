const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查 docker-compose 配置 ===\n');
    
    conn.exec('cd /opt/evolution-whatsapp && docker compose config | grep -A10 "evolution-api:"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查所有 docker-compose 文件:');
            conn.exec('ls -la /opt/evolution-whatsapp/*.yml', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n检查容器创建的参数:');
                    conn.exec('docker inspect evolution-whatsapp-evolution-api-1 | grep -E "(HostConfig|ExposedPorts|Ports)"', (err, stream) => {
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
