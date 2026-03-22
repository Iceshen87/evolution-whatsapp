const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 检查网络连接 ===\n');
    
    // 1. 检查容器网络
    console.log('1. 检查容器网络...');
    conn.exec('docker network ls', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n2. 检查 Evolution API 是否能访问 postgres...');
            conn.exec('docker exec evolution-whatsapp-evolution-api-1 nc -zv postgres 5432 2>&1 || docker exec evolution-whatsapp-evolution-api-1 ping -c 2 postgres 2>&1 || echo "Cannot reach postgres"', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n3. 检查 PostgreSQL 是否运行...');
                    conn.exec('docker ps | grep postgres', (err, stream) => {
                        stream.on('data', (d) => process.stdout.write(d.toString()));
                        stream.on('close', () => conn.end());
                    });
                });
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
