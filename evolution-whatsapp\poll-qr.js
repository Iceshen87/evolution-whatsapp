const { Client } = require('ssh2');

const conn = new Client();

function getQR(attempt, callback) {
    console.log(`\n尝试 ${attempt}/5 获取 QR 码...`);
    
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
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      if (json.base64 || json.code) {
        console.log('SUCCESS: QR Code found!');
        if (json.base64) console.log('Base64:', json.base64.substring(0, 50) + '...');
        if (json.code) console.log('Code:', json.code);
      }
    } catch(e) {}
  });
});
req.on('error', e => console.error('Error:', e.message));
req.end();
setTimeout(() => process.exit(0), 3000);
"`;
    
    conn.exec(qrCmd, (err, stream) => {
        let output = '';
        stream.on('data', d => { output += d; process.stdout.write(d.toString()); });
        stream.on('close', () => {
            if (attempt < 5 && !output.includes('base64') && !output.includes('code')) {
                setTimeout(() => getQR(attempt + 1, callback), 3000);
            } else {
                callback();
            }
        });
    });
}

conn.on('ready', () => {
    console.log('=== 轮询获取 QR 码 ===');
    getQR(1, () => {
        console.log('\n完成');
        conn.end();
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
