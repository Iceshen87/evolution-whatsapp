const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = {
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358',
  tryKeyboard: true
};

function runSSH(commands) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    
    conn.on('ready', () => {
      conn.exec(commands, (err, stream) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }
        stream.on('close', () => {
          conn.end();
          resolve(output);
        }).on('data', (data) => {
          output += data.toString();
        }).stderr.on('data', (data) => {
          output += data.toString();
        });
      });
    }).on('keyboard-interactive', (_name, _instructions, _lang, prompts, finish) => {
      finish([SERVER.password]);
    }).on('error', reject);
    
    conn.connect(SERVER);
  });
}

async function deploy() {
  console.log('=== 部署日志统计 API ===\n');
  
  // 上传 pos.js
  console.log('1. 上传 pos.js...');
  const pos = fs.readFileSync('d:\\Code\\evolution-whatsapp\\backend\\dist\\routes\\pos.js');
  await runSSH(`echo "${pos.toString('base64')}" | base64 -d > /tmp/pos.js`);
  await runSSH('docker cp /tmp/pos.js evolution-whatsapp-backend-1:/app/dist/routes/pos.js');
  
  // 重启
  console.log('2. 重启容器...');
  await runSSH('docker restart evolution-whatsapp-backend-1');
  await new Promise(r => setTimeout(r, 5000));
  
  // 测试 API
  console.log('3. 测试统计 API...');
  const stats = await runSSH('curl -s "http://localhost/api/pos/stats"');
  console.log('   /api/pos/stats:', stats.substring(0, 200));
  
  const logs = await runSSH('curl -s "http://localhost/api/pos/logs?limit=5"');
  console.log('   /api/pos/logs:', logs.substring(0, 200));
  
  console.log('\n=== 完成 ===');
  console.log('\n客户可以访问:');
  console.log('  - GET /api/pos/stats - 查看每个用户的发送统计');
  console.log('  - GET /api/pos/logs?startDate=2024-01-01&endDate=2024-12-31 - 查看详细日志');
}

deploy().catch(console.error);
