const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('1. 删除旧的 command 行...');
    conn.exec("sed -i '/command:/d' /opt/evolution-whatsapp/docker-compose.yml", (err, stream) => {
        stream.on('close', () => {
            console.log('2. 验证配置...');
            conn.exec("grep -B2 -A5 'build:' /opt/evolution-whatsapp/docker-compose.yml | head -20", (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n3. 强制删除 backend 容器...');
                    conn.exec('docker rm -f evolution-whatsapp-backend-1 2>/dev/null; echo "deleted"', (err, stream) => {
                        stream.on('data', (d) => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('4. 启动 backend...');
                            conn.exec('cd /opt/evolution-whatsapp && docker compose up -d backend', (err, stream) => {
                                stream.on('data', (d) => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('等待 15 秒...');
                                    setTimeout(() => {
                                        console.log('\n5. 检查状态...');
                                        conn.exec('docker ps | grep backend; echo "---"; docker logs --tail=10 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
                                            stream.on('data', (d) => process.stdout.write(d.toString()));
                                            stream.on('close', () => conn.end());
                                        });
                                    }, 15000);
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
