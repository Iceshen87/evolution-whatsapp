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
  console.log('=== 部署前端（含 Message Logs 页面）===\n');
  
  // 上传所有 dist 文件
  const distPath = 'd:\\Code\\evolution-whatsapp\\frontend\\dist';
  const files = fs.readdirSync(distPath);
  
  for (const file of files) {
    const filePath = path.join(distPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      console.log(`上传 ${file}...`);
      const content = fs.readFileSync(filePath);
      await runSSH(`echo "${content.toString('base64')}" | base64 -d > /tmp/${file}`);
      await runSSH(`docker cp /tmp/${file} evolution-whatsapp-nginx-1:/usr/share/nginx/html/${file}`);
    } else if (stat.isDirectory()) {
      // 处理 assets 目录
      const subFiles = fs.readdirSync(filePath);
      for (const subFile of subFiles) {
        const subFilePath = path.join(filePath, subFile);
        console.log(`上传 assets/${subFile}...`);
        const content = fs.readFileSync(subFilePath);
        await runSSH(`echo "${content.toString('base64')}" | base64 -d > /tmp/${subFile}`);
        await runSSH(`docker cp /tmp/${subFile} evolution-whatsapp-nginx-1:/usr/share/nginx/html/assets/${subFile}`);
      }
    }
  }
  
  // 重启 nginx
  console.log('\n重启 nginx...');
  await runSSH('docker restart evolution-whatsapp-nginx-1');
  
  console.log('\n=== 完成 ===');
  console.log('客户可以访问: http://8.222.170.254/logs');
}

deploy().catch(console.error);
