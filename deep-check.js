const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 深度检查 Evolution API ===\n');
    
    // 1. 检查 Evolution API 是否还在运行
    conn.exec('docker ps | grep evolution-api', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            
            // 2. 检查完整日志
            console.log('\n2. 完整日志 (最后50行):');
            conn.exec('docker logs --tail=50 evolution-whatsapp-evolution-api-1', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    
                    // 3. 直接测试 API
                    console.log('\n3. 直接测试 API:');
                    conn.exec('curl -v http://localhost:8080 2>&1 | head -30', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => conn.end());
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
