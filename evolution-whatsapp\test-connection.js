const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 测试 WhatsApp 连接 ===\n');
    
    // 测试连接到 WhatsApp 服务器
    console.log('1. 测试连接到 WhatsApp Web 服务器 (web.whatsapp.com):');
    conn.exec('curl -v --connect-timeout 10 https://web.whatsapp.com 2>&1 | head -20', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n2. 测试连接到 WhatsApp 聊天服务器 (g.whatsapp.net):');
            conn.exec('nc -zv g.whatsapp.net 443 2>&1 || echo "Connection test"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n3. 测试 DNS 解析:');
                    conn.exec('nslookup web.whatsapp.com', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n4. 检查当前网络出口 IP:');
                            conn.exec('curl -s http://ip.sb', (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n=== 测试完成 ===');
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
