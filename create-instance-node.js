const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 使用 Node.js 创建 test_1 实例 ===\n');
    
    const createCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const data = JSON.stringify({
  instanceName: 'test_1',
  integration: 'WHATSAPP-BAILEYS',
  qrcode: true
});
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/instance/create',
  method: 'POST',
  headers: {
    'apikey': '684de76250938ef254f136318374608b',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Create response:', data || '(empty)'));
});
req.on('error', e => console.error('Error:', e.message));
req.write(data);
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
    
    conn.exec(createCmd, (err, stream) => {
        let output = '';
        stream.on('data', d => { output += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n创建请求已发送');
            
            // 等待 5 秒后检查实例列表
            setTimeout(() => {
                console.log('\n检查实例列表:');
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
  res.on('end', () => console.log('Instances:', data || '(empty)'));
});
req.on('error', e => console.error('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
                conn.exec(listCmd, (err, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => {
                        console.log('\n完成');
                        conn.end();
                    });
                });
            }, 5000);
        });
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
