const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('检查当前 Dockerfile CMD...');
    conn.exec('grep CMD /opt/evolution-whatsapp/backend/Dockerfile', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n强制重新构建镜像（不使用缓存）...');
            conn.exec('cd /opt/evolution-whatsapp && docker compose build --no-cache backend', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n删除旧容器...');
                    conn.exec('docker rm -f evolution-whatsapp-backend-1', (err, stream) => {
                        stream.on('close', () => {
                            console.log('启动新容器...');
                            conn.exec('cd /opt/evolution-whatsapp && docker compose up -d backend', (err, stream) => {
                                stream.on('data', (d) => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('等待 15 秒...');
                                    setTimeout(() => {
                                        console.log('\n检查:');
                                        conn.exec('docker logs --tail=5 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
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
