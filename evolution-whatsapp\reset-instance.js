const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 重置 test_1 实例 ===\n');
    
    // 登出实例
    const logoutCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/instance/logout/test_1',
  method: 'DELETE',
  headers: { 'apikey': '684de76250938ef254f136318374608b' }
};
const req = http.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('Logout:', data));
});
req.on('error', e => console.log('Logout error:', e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
    
    conn.exec(logoutCmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n等待 3 秒...');
            
            setTimeout(() => {
                // 检查状态
                const statusCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/instance/connectionState/test_1',
  method: 'GET',
  headers: { 'apikey': '684de76250938ef254f136318374608b' }
};
const req = http.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('Status:', data));
});
req.on('error', e => console.log('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
                
                conn.exec(statusCmd, (err, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => {
                        console.log('\n尝试获取 QR 码...');
                        
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
const req = http.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('QR:', data));
});
req.on('error', e => console.log('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`;
                        
                        conn.exec(qrCmd, (err, stream) => {
                            stream.on('data', d => process.stdout.write(d.toString()));
                            stream.on('close', () => {
                                console.log('\n完成 - 请刷新页面尝试');
                                conn.end();
                            });
                        });
                    });
                });
            }, 3000);
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
