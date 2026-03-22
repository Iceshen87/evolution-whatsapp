const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('修复 Prisma 数据库...');
    
    // 方法1: 直接在容器内运行 prisma migrate deploy --skip-seed
    conn.exec('docker exec evolution-whatsapp-backend-1 sh -c "npx prisma migrate deploy --skip-seed || npx prisma db push --skip-generate"', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n重启 backend...');
            conn.exec('docker restart evolution-whatsapp-backend-1', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n等待 10 秒...');
                    setTimeout(() => {
                        conn.exec('docker logs --tail=10 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
                            stream.on('data', (d) => process.stdout.write(d.toString()));
                            stream.on('close', () => conn.end());
                        });
                    }, 10000);
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
