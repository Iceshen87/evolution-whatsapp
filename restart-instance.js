const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 重启 test_1 实例以生成 QR 码 ===\n');
    
    // 1. 先登出实例
    const logoutCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/instance/logout/test_1',
  method: 'DELETE',
  headers: { 'apikey': '684de76250938ef254f136318374608b' }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Logout:', data || 'done'));
});
req.on('error', e => console.log('Logout error:', e.message));
req.end();
setTimeout(() => process.exit(0), 3000);
"`;
    
    conn.exec(logoutCmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n等待 3 秒...');
            
            setTimeout(() => {
                // 2. 重新连接实例（生成 QR 码）
                const connectCmd = `docker exec evolution-whatsapp-backend-1 node -e "
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
    console.log('Connect response:', data);
    try {
      const json = JSON.parse(data);
      if (json.base64) {
        console.log('QR Code (base64):', json.base64.substring(0, 100) + '...');
      } else if (json.code) {
        console.log('Pairing code:', json.code);
      } else {
        console.log('Response keys:', Object.keys(json));
      }
    } catch(e) {
      console.log('Raw response:', data);
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
                
                conn.exec(connectCmd, (err, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => {
                        console.log('\n完成 - 请刷新页面查看 QR 码');
                        conn.end();
                    });
                });
            }, 3000);
        });
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
