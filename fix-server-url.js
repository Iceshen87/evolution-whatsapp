const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Fixing SERVER_URL...\n');
    
    // 检查当前配置
    conn.exec('grep SERVER_URL /opt/evolution-whatsapp/docker-compose.light.yml', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\nUpdating to use localhost...');
            conn.exec("sed -i 's|SERVER_URL=http://8.222.170.254:8080|SERVER_URL=http://localhost:8080|g' /opt/evolution-whatsapp/docker-compose.light.yml", (err, stream) => {
                stream.on('close', () => {
                    console.log('Restarting...');
                    conn.exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml restart evolution-api', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\nWaiting 15s...');
                            setTimeout(() => {
                                console.log('Done. Try: http://8.222.170.254:8080/manager/');
                                conn.end();
                            }, 15000);
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
