const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 部署端口映射 ===\n');
    
    // 停止服务
    conn.exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml down', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('服务已停止');
            
            // 更新 docker-compose 文件 - 添加端口映射
            conn.exec('cd /opt/evolution-whatsapp && sed -i "/image: atendai\/evolution-api:latest/a\\    ports:\\n      - \\"8080:8080\\"" docker-compose.light.yml', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('端口映射已添加');
                    
                    // 启动服务
                    conn.exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n等待 20 秒...');
                            setTimeout(() => {
                                // 测试
                                conn.exec('curl -s http://localhost:8080 -H "apikey: 684de76250938ef254f136318374608b" 2>&1 | head -20', (err, stream) => {
                                    stream.on('data', d => process.stdout.write(d.toString()));
                                    stream.on('close', () => {
                                        console.log('\n=== 完成 ===');
                                        console.log('Manager: http://8.222.170.254:8080/manager');
                                        conn.end();
                                    });
                                });
                            }, 20000);
                        });
                    });
                });
            });
        });
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
