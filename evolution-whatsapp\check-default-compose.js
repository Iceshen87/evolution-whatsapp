const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查默认 docker-compose.yml ===\n');
    
    conn.exec('cat /opt/evolution-whatsapp/docker-compose.yml | grep -A15 "evolution-api:"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
