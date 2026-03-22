const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查服务器状态 ===\n');
    
    conn.exec('docker ps --format "table {{.Names}}\\t{{.Ports}}\\t{{.Status}}"', (err, stream) => {
        stream.on('data', (d) => console.log(d.toString()));
        stream.on('close', () => {
            console.log('\n检查 API 版本:');
            conn.exec('curl -s http://localhost:8080', (err, stream) => {
                stream.on('data', (d) => console.log(d.toString()));
                stream.on('close', () => {
                    conn.end();
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
