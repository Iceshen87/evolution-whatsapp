const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 测试端口连接 ===\n');
    
    // 使用 Node.js 测试
    conn.exec(`docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
http.get('http://evolution-api:8080', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data.substring(0, 100)));
}).on('error', e => console.log('Error:', e.message));
setTimeout(() => process.exit(0), 5000);
"`, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n从宿主机测试:');
            conn.exec(`ssh -o StrictHostKeyChecking=no localhost << 'ENDSSH'
curl -s http://localhost:8080/manager | head -20
ENDSSH`, (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n检查 docker-compose 配置:');
                    conn.exec('grep -A5 "evolution-api:" /opt/evolution-whatsapp/docker-compose.light.yml | head -15', (err, stream) => {
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
