const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 读取 schema.prisma
  const schema = fs.readFileSync('backend/prisma/schema.prisma');
  
  // 上传并执行 prisma db push
  const cmd = `echo "${schema.toString('base64')}" | base64 -d > /opt/evolution-whatsapp/backend/prisma/schema.prisma`;
  
  conn.exec(cmd, (err, stream) => {
    stream.on('close', () => {
      console.log('Schema uploaded');
      
      // 重启后端
      conn.exec('docker restart evolution-whatsapp-backend-1', (err, stream) => {
        stream.on('close', () => {
          console.log('Backend restarted');
          
          // 等待启动
          setTimeout(() => {
            // 测试后端
            conn.exec('curl -s http://localhost:3000/api/web/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"Admin@20260321"}\'', (err, stream) => {
              stream.on('data', d => process.stdout.write(d));
              stream.on('close', () => conn.end());
            });
          }, 10000);
        });
      });
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
