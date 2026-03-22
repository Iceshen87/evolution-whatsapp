const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 使用 Node.js 测试后端连接 ===\n');
    
    // 在后端容器内用 Node.js 测试
    const testCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/',
  method: 'GET',
  headers: { 'apikey': '684de76250938ef254f136318374608b' }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data.substring(0, 200)));
});
req.on('error', e => console.error('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
    
    conn.exec(testCmd, (err, stream) => {
        let output = '';
        stream.on('data', d => { output += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n测试完成');
            conn.end();
        });
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
