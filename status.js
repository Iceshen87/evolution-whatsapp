const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('=== 服务状态 ===');
    conn.exec('docker ps', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
});
conn.on('error', (e) => console.error(e.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
