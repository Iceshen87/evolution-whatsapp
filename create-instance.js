const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 在 Evolution API 中创建 test_1 实例 ===\n');
    
    // 创建实例
    const createCmd = `curl -s -X POST http://localhost:8080/instance/create \\
        -H "apikey: 684de76250938ef254f136318374608b" \\
        -H "Content-Type: application/json" \\
        -d '{"instanceName":"test_1","integration":"WHATSAPP-BAILEYS","qrcode":true}'`;
    
    conn.exec(createCmd, (err, stream) => {
        if (err) {
            console.error('Exec error:', err);
            conn.end();
            return;
        }
        
        let output = '';
        stream.on('data', (d) => {
            output += d.toString();
            process.stdout.write(d.toString());
        });
        stream.stderr.on('data', (d) => process.stdout.write(d.toString()));
        
        stream.on('close', () => {
            console.log('\n\n创建响应:', output || '(empty)');
            
            // 等待 3 秒后检查
            setTimeout(() => {
                console.log('\n检查实例列表:');
                conn.exec('curl -s http://localhost:8080/instance/fetchInstances -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                    let output2 = '';
                    stream.on('data', (d) => output2 += d.toString());
                    stream.on('close', () => {
                        console.log(output2 || '(empty)');
                        
                        // 获取 QR 码
                        setTimeout(() => {
                            console.log('\n获取 QR 码:');
                            conn.exec('curl -s http://localhost:8080/instance/connect/test_1 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                                let output3 = '';
                                stream.on('data', (d) => output3 += d.toString());
                                stream.on('close', () => {
                                    console.log(output3.substring(0, 500) || '(empty)');
                                    conn.end();
                                });
                            });
                        }, 2000);
                    });
                });
            }, 3000);
        });
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
