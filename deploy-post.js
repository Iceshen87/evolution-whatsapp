const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

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
  console.log('=== 部署 POST 支持修复 ===\n');
  
  // 上传 dist/routes/pos.js
  console.log('1. 上传 pos.js...');
  const posFile = fs.readFileSync('d:\\Code\\evolution-whatsapp\\backend\\dist\\routes\\pos.js');
  const base64 = posFile.toString('base64');
  await runSSH(`echo "${base64}" | base64 -d > /tmp/pos.js`);
  
  // 复制到容器
  console.log('2. 复制到容器...');
  await runSSH('docker cp /tmp/pos.js evolution-whatsapp-backend-1:/app/dist/routes/pos.js');
  
  // 重启
  console.log('3. 重启容器...');
  await runSSH('docker restart evolution-whatsapp-backend-1');
  
  // 等待
  await new Promise(r => setTimeout(r, 5000));
  
  // 测试 GET
  console.log('4. 测试 GET...');
  const getTest = await runSSH('curl -s "http://localhost/api/pos/send?number=60125600315&type=text&message=GETTest&instance_id=131A4DAC3D9B4&access_token=75a65a1b69b24"');
  console.log('   GET:', getTest.substring(0, 100));
  
  // 测试 POST
  console.log('5. 测试 POST...');
  const postTest = await runSSH('curl -s -X POST http://localhost/api/pos/send -H "Content-Type: application/json" -d \'{"number":"60125600315","type":"text","message":"POSTTest","instance_id":"131A4DAC3D9B4","access_token":"75a65a1b69b24"}\'');
  console.log('   POST:', postTest.substring(0, 100));
  
  console.log('\n=== 完成 ===');
}

deploy().catch(console.error);
