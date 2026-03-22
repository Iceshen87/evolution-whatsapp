const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('开始升级到 v1.8.7...');
    
    const cmd = `sed -i 's|atendai/evolution-api:latest|atendai/evolution-api:v1.8.7|g' /opt/evolution-whatsapp/docker-compose.yml && docker compose stop evolution-api && docker rm -f evolution-whatsapp-evolution-api-1 2>/dev/null; docker compose up -d evolution-api && echo "完成"`;
    
    conn.exec(cmd, (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n等待 30 秒...');
            setTimeout(() => {
                conn.exec('curl -s http://localhost:8080', (err, stream) => {
                    stream.on('data', (d) => process.stdout.write(d.toString()));
                    stream.on('close', () => conn.end());
                });
            }, 30000);
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
