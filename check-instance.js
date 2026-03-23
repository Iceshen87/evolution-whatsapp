const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 检查 Evolution API 实例状态 ===\n');
    
    // 获取 Evolution API 中的实例列表
    conn.exec('curl -s http://localhost:8080/instance/fetchInstances -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
        let output = '';
        stream.on('data', (data) => output += data.toString());
        stream.on('close', () => {
            console.log('Evolution API 实例:');
            try {
                const instances = JSON.parse(output);
                console.log(JSON.stringify(instances, null, 2));
            } catch (e) {
                console.log(output);
            }
            
            console.log('\n=== 后端日志 ===');
            conn.exec('docker logs --tail=30 evolution-whatsapp-backend-1', (err, stream) => {
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
