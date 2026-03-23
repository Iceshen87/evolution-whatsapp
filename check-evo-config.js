const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查 Evolution API 配置 ===\n');
    
    // 检查 Evolution API 日志
    conn.exec('docker logs --tail=50 evolution-whatsapp-evolution-api-1', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n\n检查环境变量:');
            conn.exec('docker exec evolution-whatsapp-evolution-api-1 env | grep -E "SERVER|URL|TOKEN|DEL"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n检查实例列表:');
                    conn.exec(`docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/instance/fetchInstances',
  method: 'GET',
  headers: { 'apikey': '684de76250938ef254f136318374608b' }
};
const req = http.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const instances = JSON.parse(data);
    instances.forEach(i => console.log(i.name, '->', i.connectionStatus));
  });
});
req.on('error', e => console.error(e.message));
req.end();
setTimeout(() => process.exit(0), 3000);
"`, (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => conn.end());
                    });
                });
            });
        });
    });
});

conn.on('error', err => {
    console.error('SSH Error:', err.message);
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
