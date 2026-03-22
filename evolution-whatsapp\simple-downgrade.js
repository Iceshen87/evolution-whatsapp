const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 降级到 v1.8.0 ===\n');
    
    // 修改镜像版本
    conn.exec("sed -i 's/evolution-api:latest/evolution-api:v1.8.0/g' /opt/evolution-whatsapp/docker-compose.light.yml", (err, stream) => {
        stream.on('close', () => {
            console.log('配置已修改');
            
            // 停止服务
            conn.exec('cd /opt/evolution-whatsapp && docker compose down', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n删除旧镜像...');
                    conn.exec('docker rmi atendai/evolution-api:latest 2>/dev/null; echo done', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n启动 v1.8.0...');
                            conn.exec('cd /opt/evolution-whatsapp && docker compose up -d', (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n等待 40 秒...');
                                    setTimeout(() => {
                                        console.log('\n检查状态:');
                                        conn.exec('docker ps | grep evolution-api', (err, stream) => {
                                            stream.on('data', d => process.stdout.write(d.toString()));
                                            stream.on('close', () => {
                                                conn.end();
                                            });
                                        });
                                    }, 40000);
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
