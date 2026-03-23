const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 检查 Evolution API 健康状态 ===\n');
    
    // 检查 Evolution API 是否响应
    conn.exec('curl -s http://localhost:8080 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
        let output = '';
        stream.on('data', (data) => output += data.toString());
        stream.on('close', () => {
            console.log('Evolution API response:');
            console.log(output || '(empty)');
            
            console.log('\n=== Evolution API 日志 ===');
            conn.exec('docker logs --tail=50 evolution-whatsapp-evolution-api-1', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
});

conn.on('error', (err) => console.error('Error:', err.message));

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
