const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('添加 command 到 backend...');
    
    // 直接替换整行
    conn.exec("sed -i 's/build: \\.\\//command: [\"sh\", \"-c\", \"npx prisma db push --skip-generate \\&\\& node dist/main.js\"],\\n    build: ./' /opt/evolution-whatsapp/docker-compose.yml", (err, stream) => {
        stream.on('close', () => {
            console.log('验证配置:');
            conn.exec("grep -A3 'command:' /opt/evolution-whatsapp/docker-compose.yml", (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n重启 backend...');
                    conn.exec('cd /opt/evolution-whatsapp && docker compose up -d backend', (err, stream) => {
                        stream.on('data', (d) => process.stdout.write(d.toString()));
                        stream.on('close', () => {
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
    });
});

conn.on('error', (err) => console.error(err.message));
conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
