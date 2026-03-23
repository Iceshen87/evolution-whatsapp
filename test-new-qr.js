const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 测试新的 QR 码获取 ===\n');
    
    // 检查后端日志
    conn.exec('docker logs --tail=20 evolution-whatsapp-backend-1', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n\n测试 QR 接口...');
            
            // 获取 token 并测试
            conn.exec(`docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const loginData = JSON.stringify({username:'admin',password:'Admin@20260321'});
const loginOpts = {hostname:'backend',port:3000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':loginData.length}};
const loginReq = http.request(loginOpts, loginRes => {
  let data = '';
  loginRes.on('data', c => data += c);
  loginRes.on('end', () => {
    const token = JSON.parse(data).token;
    console.log('Token:', token ? 'Got' : 'None');
    
    const qrOpts = {hostname:'backend',port:3000,path:'/api/web/instances/test_1/qr',headers:{'Authorization':'Bearer '+token}};
    const qrReq = http.request(qrOpts, qrRes => {
      let qrData = '';
      qrRes.on('data', c => qrData += c);
      qrRes.on('end', () => console.log('QR Response:', qrData.substring(0, 300)));
    });
    qrReq.on('error', e => console.error('QR Error:', e.message));
    qrReq.end();
  });
});
loginReq.on('error', e => console.error('Login Error:', e.message));
loginReq.write(loginData);
loginReq.end();
setTimeout(() => process.exit(0), 10000);
"`, (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n完成');
                    conn.end();
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
