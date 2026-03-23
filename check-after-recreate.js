const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 检查实例状态 ===\n');
    
    // 检查实例列表
    const listCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/instance/fetchInstances',
  method: 'GET',
  headers: { 'apikey': '684de76250938ef254f136318374608b' }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Instances:', data);
    try {
      const json = JSON.parse(data);
      const test1 = json.find(i => i.name === 'test_1');
      if (test1) {
        console.log('test_1 found:', JSON.stringify(test1, null, 2));
      } else {
        console.log('test_1 NOT found');
      }
    } catch(e) {}
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
    
    conn.exec(listCmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
