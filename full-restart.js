const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 完全重启所有服务 ===\n');
    
    const cmd = `
cd /opt/evolution-whatsapp &&
docker compose down &&
docker compose up -d --force-recreate
echo "Done"
`;
    
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n等待 60 秒...');
            setTimeout(() => {
                console.log('\n检查所有服务:');
                conn.exec('docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"', (err, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => {
                        console.log('\n测试 API:');
                        conn.exec('curl -s http://localhost:8080', (err, stream) => {
                            stream.on('data', d => process.stdout.write(d.toString()));
                            stream.on('close', () => conn.end());
                        });
                    });
                });
            }, 60000);
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
