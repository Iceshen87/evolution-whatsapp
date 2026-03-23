const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 检查后端的 Evolution API 配置 ===\n');
    
    // 检查后端容器内的环境变量
    conn.exec('docker exec evolution-whatsapp-backend-1 env | grep -i evolution', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n=== 测试后端连接到 Evolution API ===');
            conn.exec('docker exec evolution-whatsapp-backend-1 node -e "const http = require(\'http\'); const req = http.get(\'http://evolution-api:8080\', {headers:{apikey:\'684de76250938ef254f136318374608b\'}}, (res) => { let data = \'\'; res.on(\'data\', chunk => data += chunk); res.on(\'end\', () => console.log(\'Response:\', data.substring(0, 200))); }).on(\'error\', e => console.error(\'Error:\', e.message)); setTimeout(() => process.exit(0), 5000);"', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.stderr.on('data', (d) => process.stdout.write(d.toString()));
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
