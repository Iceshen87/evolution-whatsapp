const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('强制删除 backend 容器...');
    conn.exec('docker rm -f evolution-whatsapp-backend-1 2>&1 || true', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('等待 2 秒...');
            setTimeout(() => {
                console.log('启动新的 backend 容器...');
                conn.exec('cd /opt/evolution-whatsapp && docker compose up -d backend', (err, stream) => {
                    stream.on('data', (d) => process.stdout.write(d.toString()));
                    stream.on('close', () => {
                        console.log('等待 20 秒启动...');
                        setTimeout(() => {
                            console.log('检查容器状态:');
                            conn.exec('docker ps -a | grep backend', (err, stream) => {
                                stream.on('data', (d) => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n检查日志:');
                                    conn.exec('docker logs --tail=15 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
                                        stream.on('data', (d) => process.stdout.write(d.toString()));
                                        stream.on('close', () => conn.end());
                                    });
                                });
                            });
                        }, 20000);
                    });
                });
            }, 2000);
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
