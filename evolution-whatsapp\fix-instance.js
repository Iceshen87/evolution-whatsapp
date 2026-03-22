const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 修复实例连接问题 ===\n');
    
    // 先尝试连接实例
    conn.exec('curl -s -X POST http://localhost:8080/instance/connect/123 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n等待 5 秒...');
            setTimeout(() => {
                console.log('\n再次获取 QR 码:');
                conn.exec('curl -s http://localhost:8080/instance/connect/123 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => {
                        console.log('\n检查实例状态:');
                        conn.exec('curl -s http://localhost:8080/instance/connectionState/123 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                            stream.on('data', d => process.stdout.write(d.toString()));
                            stream.on('close', () => {
                                console.log('\n=== 完成 ===');
                                console.log('请刷新页面重试 Bind QR');
                                conn.end();
                            });
                        });
                    });
                });
            }, 5000);
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
