const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected, fixing PostgreSQL...');
    
    // 1. 创建用户
    conn.exec('docker exec evolution-whatsapp-postgres-1 psql -U postgres -c "DROP USER IF EXISTS evolution;"', (err, stream) => {
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.on('close', () => {
            console.log('1. Drop user done');
            
            // 2. 创建用户
            conn.exec("docker exec evolution-whatsapp-postgres-1 psql -U postgres -c \"CREATE USER evolution WITH PASSWORD 'da3646ae048a2de4d2d11349b33b1413';\"", (err, stream) => {
                stream.on('data', (data) => process.stdout.write(data.toString()));
                stream.on('close', () => {
                    console.log('2. Create user done');
                    
                    // 3. 授权
                    conn.exec("docker exec evolution-whatsapp-postgres-1 psql -U postgres -c \"GRANT ALL PRIVILEGES ON DATABASE evolution TO evolution; ALTER DATABASE evolution OWNER TO evolution;\"", (err, stream) => {
                        stream.on('data', (data) => process.stdout.write(data.toString()));
                        stream.on('close', () => {
                            console.log('3. Grant done');
                            
                            // 4. 重启 Evolution API
                            conn.exec('docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml restart evolution-api', (err, stream) => {
                                stream.on('data', (data) => process.stdout.write(data.toString()));
                                stream.on('close', () => {
                                    console.log('4. Restarting Evolution API...');
                                    
                                    setTimeout(() => {
                                        conn.exec('docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml logs --tail=20 evolution-api', (err, stream) => {
                                            stream.on('data', (data) => process.stdout.write(data.toString()));
                                            stream.on('close', () => {
                                                console.log('\nFix complete!');
                                                conn.end();
                                            });
                                        });
                                    }, 15000);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', (err) => {
    console.error('SSH Error:', err.message);
    process.exit(1);
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
