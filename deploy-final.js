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
  console.log('=== 重新构建并部署后端 ===\n');
  
  // 1. 先查看服务器上 dist/services/evolution.js 的内容
  console.log('1. 检查服务器上的 evolution.js...');
  const check = await runSSH('docker exec evolution-whatsapp-backend-1 cat /app/dist/services/evolution.js 2>&1 | grep -A5 "sendText"');
  console.log(check.substring(0, 500));
  
  // 2. 检查 dist 目录下的所有文件
  console.log('\n2. 服务器 dist 目录:');
  const files = await runSSH('docker exec evolution-whatsapp-backend-1 ls -la /app/dist/services/ 2>&1');
  console.log(files);
  
  // 3. 重新复制所有 dist 文件
  console.log('\n3. 重新打包上传 dist...');
  const distDir = 'd:\\Code\\evolution-whatsapp\\backend\\dist';
  
  // 读取 dist/services/evolution.js 检查本地版本
  const localFile = fs.readFileSync(path.join(distDir, 'services', 'evolution.js'), 'utf8');
  console.log('本地 sendText 函数:');
  const match = localFile.match(/async sendText[\s\S]{0,300}/);
  if (match) console.log(match[0].substring(0, 300));
  
  // 4. 通过 docker cp 复制
  console.log('\n4. 逐文件上传 dist...');
  
  // 简单方法：逐文件复制
  const distFiles = [];
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(distDir, fullPath).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else {
        distFiles.push({ fullPath, relPath });
      }
    }
  }
  walkDir(distDir);
  
  console.log(`   找到 ${distFiles.length} 个文件`);
  
  // 创建临时目录结构
  await runSSH('rm -rf /tmp/evolution-dist && mkdir -p /tmp/evolution-dist');
  
  // 上传所有文件
  for (const file of distFiles) {
    const content = fs.readFileSync(file.fullPath);
    const base64 = content.toString('base64');
    const cmd = `mkdir -p /tmp/evolution-dist/${path.dirname(file.relPath)} && echo "${base64}" | base64 -d > /tmp/evolution-dist/${file.relPath}`;
    try {
      await runSSH(cmd);
    } catch (e) {}
  }
  
  console.log('   上传完成');
  
  // 5. 复制到容器
  console.log('\n5. 复制到容器...');
  await runSSH('docker cp /tmp/evolution-dist/. evolution-whatsapp-backend-1:/app/dist/');
  
  // 6. 重启容器
  console.log('\n6. 重启容器...');
  await runSSH('docker restart evolution-whatsapp-backend-1');
  
  // 7. 等待启动
  await new Promise(r => setTimeout(r, 5000));
  
  // 8. 测试
  console.log('\n7. 测试...');
  const test = await runSSH('curl -s "http://localhost/api/pos/send?number=60125600315&type=text&message=DeployTest&instance_id=131A4DAC3D9B4&access_token=75a65a1b69b24"');
  console.log('   响应:', test);
  
  console.log('\n=== 完成 ===');
}

deploy().catch(console.error);
