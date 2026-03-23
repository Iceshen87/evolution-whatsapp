const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('检查 docker-compose.yml 中的 backend 配置...');
    conn.exec('grep -A10 "^  backend:" /opt/evolution-whatsapp/docker-compose.yml', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n删除 docker-compose.yml 中的 command...');
            conn.exec("sed -i '/^    command:/d' /opt/evolution-whatsapp/docker-compose.yml", (err, stream) => {
                stream.on('close', () => {
                    console.log('验证:');
                    conn.exec('grep -A10 "^  backend:" /opt/evolution-whatsapp/docker-compose.yml', (err, stream) => {
                        stream.on('data', (d) => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n重新创建 backend...');
                            conn.exec('cd /opt/evolution-whatsapp && docker compose up -d --force-recreate backend', (err, stream) => {
                                stream.on('data', (d) => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    setTimeout(() => {
                                        conn.exec('docker logs --tail=10 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
                                            stream.on('data', (d) => process.stdout.write(d.toString()));
                                            stream.on('close', () => conn.end());
                                        });
                                    }, 10000);
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
