const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 调试 QR 码生成 ===\n');
    
    // 1. 检查实例 123 的完整信息
    console.log('1. 获取实例 123 的详细信息:');
    conn.exec('curl -s http://localhost:8080/instance/fetchInstances -H "apikey: 684de76250938ef254f136318374608b" 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); i=[x for x in d if x[\"name\"]==\"123\"]; print(json.dumps(i[0] if i else {}, indent=2))" 2>/dev/null || echo "Python not available"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n2. 尝试重新启动实例连接:');
            conn.exec('curl -s http://localhost:8080/instance/restart/123 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n3. 等待 10 秒后获取 QR 码:');
                    setTimeout(() => {
                        conn.exec('curl -s http://localhost:8080/instance/connect/123 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                            stream.on('data', d => process.stdout.write(d.toString()));
                            stream.on('close', () => {
                                console.log('\n4. 检查 Evolution API 错误日志:');
                                conn.exec('docker logs evolution-whatsapp-evolution-api-1 2>&1 | grep -E "(ERROR|WARN|123)" | tail -20', (err, stream) => {
                                    stream.on('data', d => process.stdout.write(d.toString()));
                                    stream.on('close', () => {
                                        conn.end();
                                    });
                                });
                            });
                        });
                    }, 10000);
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
