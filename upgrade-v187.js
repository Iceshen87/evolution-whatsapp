const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 升级到 v1.8.7 ===\n');
    
    // 修改 docker-compose.yml 使用 v1.8.7
    conn.exec("sed -i 's|atendai/evolution-api:latest|atendai/evolution-api:v1.8.7|g' /opt/evolution-whatsapp/docker-compose.yml", (err, stream) => {
        stream.on('close', () => {
            console.log('1. 配置已修改');
            
            // 停止并删除旧容器
            conn.exec('cd /opt/evolution-whatsapp && docker compose stop evolution-api && docker rm -f evolution-whatsapp-evolution-api-1', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n2. 拉取 v1.8.7...');
                    conn.exec('docker pull atendai/evolution-api:v1.8.7', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n3. 启动 v1.8.7...');
                            conn.exec('cd /opt/evolution-whatsapp && docker compose up -d evolution-api', (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n4. 等待 30 秒启动...');
                                    setTimeout(() => {
                                        console.log('\n检查版本:');
                                        conn.exec('curl -s http://localhost:8080', (err, stream) => {
                                            stream.on('data', d => process.stdout.write(d.toString()));
                                            stream.on('close', () => conn.end());
                                        });
                                    }, 30000);
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
