const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 查询用户数据 ===\n');
    
    // 使用 Prisma 查询
    conn.exec('docker exec evolution-whatsapp-backend-1 npx prisma db execute --stdin <<EOF\nSELECT id, username, instanceName, role FROM User;\nEOF', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
});

conn.on('error', (err) => console.error('Error:', err.message));

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
