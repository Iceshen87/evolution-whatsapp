const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== Evolution API Manager 访问信息 ===\n');
    
    // 获取 Evolution API 的 token
    const tokenCmd = `docker exec evolution-whatsapp-backend-1 node -e "
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
    try {
      const json = JSON.parse(data);
      const test1 = json.find(i => i.name === 'test_1');
      if (test1) {
        console.log('Instance: test_1');
        console.log('Token:', test1.token);
        console.log('Status:', test1.connectionStatus);
      }
    } catch(e) {
      console.log('Error parsing:', e.message);
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 3000);
"`;
    
    conn.exec(tokenCmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n\n=== 访问 Manager 页面 ===');
            console.log('URL: http://8.222.170.254:8080/manager');
            console.log('API Key: 684de76250938ef254f136318374608b');
            console.log('\n注意: 需要在服务器上开放 8080 端口才能外部访问');
            console.log('或者使用 SSH 隧道: ssh -L 8080:localhost:8080 root@8.222.170.254');
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
