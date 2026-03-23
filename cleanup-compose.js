const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('删除所有 command 行...');
    conn.exec("sed -i '/^    command:/d' /opt/evolution-whatsapp/docker-compose.yml", (err, stream) => {
        stream.on('close', () => {
            console.log('验证 backend 配置:');
            conn.exec("grep -A5 '^  backend:' /opt/evolution-whatsapp/docker-compose.yml", (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n删除旧容器...');
                    conn.exec('docker rm -f evolution-whatsapp-backend-1', (err, stream) => {
                        stream.on('close', () => {
                            console.log('启动新容器...');
                            conn.exec('cd /opt/evolution-whatsapp && docker compose up -d backend', (err, stream) => {
                                stream.on('data', (d) => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    setTimeout(() => {
                                        conn.exec('docker logs --tail=15 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
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
