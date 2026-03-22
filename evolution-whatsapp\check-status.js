const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 检查 test_1 状态 ===\n');
    
    // 检查连接状态
    const statusCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/instance/connectionState/test_1',
  method: 'GET',
  headers: { 'apikey': '684de76250938ef254f136318374608b' }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', data);
    try {
      const json = JSON.parse(data);
      console.log('State:', json.instance?.state || json.state || 'unknown');
    } catch(e) {}
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
    
    conn.exec(statusCmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
