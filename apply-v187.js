const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 应用 v1.8.7 配置 ===\n');
    
    // 检查当前配置
    conn.exec('grep "evolution-api:" /opt/evolution-whatsapp/docker-compose.yml', (err, stream) => {
        stream.on('data', (d) => console.log(d.toString()));
        stream.on('close', () => {
            // 修改为 v1.8.7
            conn.exec("sed -i 's|atendai/evolution-api:latest|atendai/evolution-api:v1.8.7|g' /opt/evolution-whatsapp/docker-compose.yml", (err, stream) => {
                stream.on('close', () => {
                    console.log('\n配置已修改为 v1.8.7');
                    
                    // 重启 Evolution API
                    conn.exec('cd /opt/evolution-whatsapp && docker compose stop evolution-api && docker rm -f evolution-whatsapp-evolution-api-1 && docker compose up -d evolution-api', (err, stream) => {
                        stream.on('data', (d) => console.log(d.toString()));
                        stream.on('close', () => {
                            console.log('\n等待 30 秒...');
                            setTimeout(() => {
                                conn.exec('curl -s http://localhost:8080', (err, stream) => {
                                    stream.on('data', (d) => console.log(d.toString()));
                                    stream.on('close', () => conn.end());
                                });
                            }, 30000);
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
