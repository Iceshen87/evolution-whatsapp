const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('检查 backend 日志:');
    conn.exec('docker logs --tail=30 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查环境变量:');
            conn.exec('grep "EVOLUTION" /opt/evolution-whatsapp/.env', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
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
