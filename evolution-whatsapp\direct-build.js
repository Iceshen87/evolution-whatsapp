const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('1. 验证 Dockerfile CMD...');
    conn.exec('grep "CMD" /opt/evolution-whatsapp/backend/Dockerfile', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n2. 重新构建 backend...');
            conn.exec('cd /opt/evolution-whatsapp && docker compose build --no-cache backend', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n3. 启动 backend...');
                    conn.exec('cd /opt/evolution-whatsapp && docker compose up -d backend', (err, stream) => {
                        stream.on('data', (d) => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            setTimeout(() => {
                                conn.exec('docker ps | grep backend; docker logs --tail=10 evolution-whatsapp-backend-1', (err, stream) => {
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

conn.on('error', (err) => console.error(err.message));
conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
