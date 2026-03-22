const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 启动 test_1 实例 ===\n');
    
    // 尝试启动实例
    const startCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const postData = JSON.stringify({
  instanceName: 'test_1',
  token: 'D0C9839D-3717-4F1F-933C-7AD44777813D'
});
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/instance/start',
  method: 'POST',
  headers: {
    'apikey': '684de76250938ef254f136318374608b',
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Start response:', data);
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(postData);
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
    
    conn.exec(startCmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n等待 5 秒后获取 QR 码...');
            
            setTimeout(() => {
                // 获取 QR 码
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
  res.on('end', () => console.log('QR:', data));
});
req.on('error', e => console.error('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
                
                conn.exec(qrCmd, (err, stream) => {
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
