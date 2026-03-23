const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Checking Alibaba Cloud Light Server...\n');
    
    // 检查是否为轻量服务器
    conn.exec('curl -s http://100.100.100.200/latest/meta-data/instance/region-id 2>/dev/null || echo "Not Alibaba Cloud"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查当前监听的端口:');
            conn.exec('ss -tlnp', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n检查 Docker 端口映射:');
                    conn.exec('docker port evolution-whatsapp-evolution-api-1', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n检查容器内应用状态:');
                            conn.exec('docker exec evolution-whatsapp-evolution-api-1 wget -q -O - http://localhost:8080/manager/ 2>&1 | head -5', (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n=== IMPORTANT ===');
                                    console.log('阿里云轻量服务器需要在控制台开放端口！');
                                    console.log('请登录阿里云控制台 -> 轻量应用服务器 -> 防火墙 -> 添加规则');
                                    console.log('添加 TCP 8080 端口');
                                    conn.end();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
