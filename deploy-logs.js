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
  console.log('=== 部署消息日志功能 ===\n');
  
  // 1. 上传 schema.prisma
  console.log('1. 上传 schema.prisma...');
  const schema = fs.readFileSync('d:\\Code\\evolution-whatsapp\\backend\\prisma\\schema.prisma');
  await runSSH(`echo "${schema.toString('base64')}" | base64 -d > /tmp/schema.prisma`);
  await runSSH('docker cp /tmp/schema.prisma evolution-whatsapp-backend-1:/app/prisma/schema.prisma');
  
  // 2. 上传 pos.js
  console.log('2. 上传 pos.js...');
  const pos = fs.readFileSync('d:\\Code\\evolution-whatsapp\\backend\\dist\\routes\\pos.js');
  await runSSH(`echo "${pos.toString('base64')}" | base64 -d > /tmp/pos.js`);
  await runSSH('docker cp /tmp/pos.js evolution-whatsapp-backend-1:/app/dist/routes/pos.js');
  
  // 3. 在容器内执行 Prisma migrate
  console.log('3. 更新数据库...');
  const migrate = await runSSH('docker exec evolution-whatsapp-backend-1 npx prisma db push --accept-data-loss 2>&1');
  console.log('   ', migrate.substring(0, 200));
  
  // 4. 生成 Prisma Client
  console.log('4. 生成 Prisma Client...');
  const generate = await runSSH('docker exec evolution-whatsapp-backend-1 npx prisma generate 2>&1');
  console.log('   ', generate.substring(0, 100));
  
  // 5. 重启
  console.log('5. 重启容器...');
  await runSSH('docker restart evolution-whatsapp-backend-1');
  await new Promise(r => setTimeout(r, 5000));
  
  // 6. 测试发送并检查日志
  console.log('6. 测试发送...');
  const test = await runSSH('curl -s -X POST http://localhost/api/pos/send -H "Content-Type: application/json" -d \'{"number":"60125600315","type":"text","message":"LogTest","instance_id":"131A4DAC3D9B4","access_token":"75a65a1b69b24"}\'');
  console.log('   响应:', test.substring(0, 100));
  
  // 7. 检查日志表
  console.log('7. 检查日志...');
  const logs = await runSSH('docker exec evolution-whatsapp-backend-1 sqlite3 /app/data/app.db "SELECT * FROM MessageLog ORDER BY id DESC LIMIT 3;" 2>&1');
  console.log('   最近3条日志:', logs);
  
  console.log('\n=== 完成 ===');
}

deploy().catch(console.error);
