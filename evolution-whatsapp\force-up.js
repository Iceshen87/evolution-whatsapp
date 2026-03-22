const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('强制创建 backend...');
    conn.exec('cd /opt/evolution-whatsapp && docker compose up -d --force-recreate backend', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('等待 20 秒...');
            setTimeout(() => {
                console.log('\n检查状态:');
                conn.exec('docker ps -a | grep backend', (err, stream) => {
                    stream.on('data', (d) => process.stdout.write(d.toString()));
                    stream.on('close', () => {
                        console.log('\n日志:');
                        conn.exec('docker logs --tail=10 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
                            stream.on('data', (d) => process.stdout.write(d.toString()));
                            stream.on('close', () => conn.end());
                        });
                    });
                });
            }, 20000);
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
