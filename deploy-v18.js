const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 部署 v1.8.0 ===\n');
    
    // 上传新配置
    const fs = require('fs');
    const config = fs.readFileSync('d:\\Code\\evolution-whatsapp\\docker-compose.light.yml', 'utf8');
    const encoded = Buffer.from(config).toString('base64');
    
    conn.exec(`echo '${encoded}' | base64 -d > /opt/evolution-whatsapp/docker-compose.light.yml`, (err, stream) => {
        stream.on('close', () => {
            console.log('配置已上传');
            
            // 停止并删除
            conn.exec('cd /opt/evolution-whatsapp && docker compose down', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n删除旧镜像...');
                    conn.exec('docker rmi atendai/evolution-api:latest 2>/dev/null; echo done', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n拉取 v1.8.0...');
                            conn.exec('docker pull atendai/evolution-api:v1.8.0', (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n启动...');
                                    conn.exec('cd /opt/evolution-whatsapp && docker compose up -d', (err, stream) => {
                                        stream.on('data', d => process.stdout.write(d.toString()));
                                        stream.on('close', () => {
                                            console.log('\n等待 40 秒...');
                                            setTimeout(() => {
                                                console.log('\n检查:');
                                                conn.exec('docker ps | grep evolution-api', (err, stream) => {
                                                    stream.on('data', d => process.stdout.write(d.toString()));
                                                    stream.on('close', () => conn.end());
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
