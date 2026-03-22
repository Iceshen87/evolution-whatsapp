const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('1. 检查当前镜像版本...');
    conn.exec('grep "image:" /opt/evolution-whatsapp/docker-compose.yml | grep evolution', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n2. 修改配置...');
            conn.exec('sed -i "s|atendai/evolution-api:latest|atendai/evolution-api:v1.8.7|g" /opt/evolution-whatsapp/docker-compose.yml', (err, stream) => {
                stream.on('close', () => {
                    console.log('配置已修改');
                    
                    console.log('\n3. 拉取新镜像...');
                    conn.exec('docker pull atendai/evolution-api:v1.8.7', (err, stream) => {
                        stream.on('data', (d) => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n4. 重启容器...');
                            conn.exec('cd /opt/evolution-whatsapp && docker compose stop evolution-api && docker rm -f evolution-whatsapp-evolution-api-1 && docker compose up -d evolution-api', (err, stream) => {
                                stream.on('data', (d) => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n5. 等待 30 秒...');
                                    setTimeout(() => {
                                        console.log('\n6. 检查结果:');
                                        conn.exec('curl -s http://localhost:8080', (err, stream) => {
                                            stream.on('data', (d) => process.stdout.write(d.toString()));
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

conn.on('error', (err) => console.error(err.message));
conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
