const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('检查 docker compose 服务状态...');
    conn.exec('cd /opt/evolution-whatsapp && docker compose ps', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n启动 backend...');
            conn.exec('cd /opt/evolution-whatsapp && docker compose start backend', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('等待 15 秒...');
                    setTimeout(() => {
                        console.log('\n检查状态:');
                        conn.exec('docker ps', (err, stream) => {
                            stream.on('data', (d) => process.stdout.write(d.toString()));
                            stream.on('close', () => {
                                console.log('\n检查日志:');
                                conn.exec('docker logs --tail=5 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
                                    stream.on('data', (d) => process.stdout.write(d.toString()));
                                    stream.on('close', () => conn.end());
                                });
                            });
                        });
                    }, 15000);
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
