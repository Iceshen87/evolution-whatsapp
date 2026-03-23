const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 读取 MessageLogs.tsx
  const content = fs.readFileSync('frontend/src/pages/MessageLogs.tsx');
  
  // 上传到服务器的正确位置
  const cmd = 'echo "' + content.toString('base64') + '" | base64 -d > /opt/evolution-whatsapp/frontend/src/pages/MessageLogs.tsx';
  
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', (code) => {
      console.log('MessageLogs.tsx uploaded, exit code:', code);
      
      // 验证
      conn.exec('cat /opt/evolution-whatsapp/frontend/src/pages/MessageLogs.tsx | head -5', (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => conn.end());
      });
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
