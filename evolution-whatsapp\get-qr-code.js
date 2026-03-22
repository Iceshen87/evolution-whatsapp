const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 获取 test_1 的 QR 码 ===\n');
    
    const qrCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/instance/connect/test_1',
  method: 'GET',
  headers: { 'apikey': '684de76250938ef254f136318374608b' }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('QR Response:', data || '(empty)');
    try {
      const json = JSON.parse(data);
      console.log('Parsed:', JSON.stringify(json, null, 2));
    } catch(e) {}
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
    
    conn.exec(qrCmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n完成');
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
