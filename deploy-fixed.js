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
  console.log('=== 部署修复后的后端 ===\n');
  
  // 1. 打包 dist 目录
  console.log('1. 打包 dist 文件...');
  const distDir = 'd:\\Code\\evolution-whatsapp\\backend\\dist';
  const distFiles = [];
  
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else {
        distFiles.push({ path: fullPath, rel: path.relative(distDir, fullPath) });
      }
    }
  }
  walkDir(distDir);
  console.log(`   找到 ${distFiles.length} 个文件`);
  
  // 2. 创建临时目录并复制文件
  console.log('2. 复制文件到服务器...');
  await runSSH('mkdir -p /tmp/backend-dist && rm -rf /tmp/backend-dist/*');
  
  // 3. 通过 base64 传输文件
  let transferred = 0;
  for (const file of distFiles) {
    const content = fs.readFileSync(file.path);
    const base64 = content.toString('base64');
    const cmd = `echo "${base64}" | base64 -d > /tmp/backend-dist/${file.rel}`;
    
    try {
      await runSSH(cmd);
      transferred++;
    } catch (e) {
      console.log(`   文件 ${file.rel} 传输失败`);
    }
  }
  console.log(`   传输完成: ${transferred}/${distFiles.length}`);
  
  // 4. 替换容器内的文件
  console.log('3. 替换容器内的文件...');
  const replaceCmd = `
    docker cp /tmp/backend-dist/. evolution-whatsapp-backend-1:/app/dist/ 2>&1 || 
    (docker cp /tmp/backend-dist/. $(docker ps -q --filter name=backend):/app/dist/ 2>&1)
  `;
  const replaceResult = await runSSH(replaceCmd);
  console.log('   ', replaceResult.trim() || '完成');
  
  // 5. 重启后端容器
  console.log('4. 重启后端容器...');
  await runSSH('docker restart $(docker ps -q --filter name=backend)');
  console.log('   重启完成');
  
  // 6. 等待服务启动
  console.log('5. 等待服务启动...');
  await new Promise(r => setTimeout(r, 5000));
  
  // 7. 测试
  console.log('6. 测试 POS 接口...');
  const testResult = await runSSH('curl -s "http://localhost/api/pos/send?number=60125600315&type=text&message=hello&instance_id=131A4DAC3D9B4&access_token=75a65a1b69b24"');
  console.log('   响应:', testResult.trim());
  
  console.log('\n=== 部署完成 ===');
}

deploy().catch(console.error);
