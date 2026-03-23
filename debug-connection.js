const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 详细检查实例状态 ===\n');
    
    // 获取 JWT token
    const loginCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const postData = JSON.stringify({username: 'admin', password: 'Admin@20260321'});
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'Content-Length': postData.length}
};
const req = http.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('Token:', json.token);
  });
});
req.write(postData);
req.end();
setTimeout(() => process.exit(0), 3000);
"`;
    
    conn.exec(loginCmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查 Evolution API 实例状态:');
            
            // 检查 Evolution API 实例列表
            conn.exec(`docker exec evolution-whatsapp-backend-1 node -e "
const http = require('http');
const options = {
  hostname: 'evolution-api',
  port: 8080,
  path: '/instance/fetchInstances',
  method: 'GET',
  headers: { 'apikey': '684de76250938ef254f136318374608b' }
};
const req = http.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const instances = JSON.parse(data);
    instances.forEach(i => {
      console.log('Instance:', i.name, '| Status:', i.connectionStatus, '| Has number:', !!i.number);
    });
  });
});
req.on('error', e => console.error(e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`, (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n检查 connectionState:');
                    
                    // 检查 connectionState
                    conn.exec(`docker exec evolution-whatsapp-backend-1 node -e "
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
  res.on('end', () => console.log('State:', data));
});
req.on('error', e => console.error(e.message));
req.end();
setTimeout(() => process.exit(0), 5000);
"`, (err, stream) => {
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
