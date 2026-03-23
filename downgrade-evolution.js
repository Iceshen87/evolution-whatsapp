const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 降级 Evolution API 到 v1.8.0 ===\n');
    
    // 1. 备份当前配置
    console.log('1. 备份当前配置...');
    conn.exec('cp /opt/evolution-whatsapp/docker-compose.light.yml /opt/evolution-whatsapp/docker-compose.light.yml.backup', (err, stream) => {
        stream.on('close', () => {
            console.log('2. 修改 docker-compose 使用 v1.8.0...');
            
            // 修改镜像版本
            conn.exec("sed -i 's|atendai/evolution-api:latest|atendai/evolution-api:v1.8.0|g' /opt/evolution-whatsapp/docker-compose.light.yml", (err, stream) => {
                stream.on('close', () => {
                    console.log('3. 停止并删除当前容器...');
                    conn.exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml down', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n4. 删除旧镜像...');
                            conn.exec('docker rmi atendai/evolution-api:latest 2>/dev/null; docker rmi atendai/evolution-api:v1.8.0 2>/dev/null; echo done', (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n5. 启动 v1.8.0...');
                                    conn.exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d', (err, stream) => {
                                        stream.on('data', d => process.stdout.write(d.toString()));
                                        stream.on('close', () => {
                                            console.log('\n等待 40 秒启动...');
                                            setTimeout(() => {
                                                console.log('\n6. 检查状态:');
                                                conn.exec('docker logs --tail=15 evolution-whatsapp-evolution-api-1', (err, stream) => {
                                                    stream.on('data', d => process.stdout.write(d.toString()));
                                                    stream.on('close', () => {
                                                        console.log('\n=== 完成 ===');
                                                        console.log('Evolution API 已降级到 v1.8.0');
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
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
