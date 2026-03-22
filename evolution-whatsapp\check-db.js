const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 检查后端数据库 ===\n');
    
    // 查询用户表
    conn.exec('docker exec evolution-whatsapp-backend-1 sqlite3 /app/data/app.db "SELECT id, username, instanceName, role FROM User;"', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n=== 后端日志（最近20行）===');
            conn.exec('docker logs --tail=20 evolution-whatsapp-backend-1', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
});

conn.on('error', (err) => console.error('Error:', err.message));

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
