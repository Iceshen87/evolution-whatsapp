const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('检查 Dockerfile...');
    conn.exec('cat /opt/evolution-whatsapp/backend/Dockerfile', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查是否包含 migrate...');
            conn.exec('grep "migrate" /opt/evolution-whatsapp/backend/Dockerfile', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n修改 Dockerfile...');
                    conn.exec('sed -i "s|npx prisma migrate deploy && node dist/index.js|node dist/index.js|g" /opt/evolution-whatsapp/backend/Dockerfile', (err, stream) => {
                        stream.on('close', () => {
                            console.log('验证:');
                            conn.exec('grep "CMD" /opt/evolution-whatsapp/backend/Dockerfile', (err, stream) => {
                                stream.on('data', (d) => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n重新构建...');
                                    conn.exec('cd /opt/evolution-whatsapp && docker compose build backend && docker compose up -d backend', (err, stream) => {
                                        stream.on('data', (d) => process.stdout.write(d.toString()));
                                        stream.on('close', () => {
                                            setTimeout(() => {
                                                conn.exec('docker logs --tail=5 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
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
    });
});

conn.on('error', (err) => console.error(err.message));
conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
