const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 上传 schema
  const schema = fs.readFileSync('backend/prisma/schema.prisma');
  const cmd1 = `echo "${schema.toString('base64')}" | base64 -d > /opt/evolution-whatsapp/backend/prisma/schema.prisma`;
  
  conn.exec(cmd1, (err, stream) => {
    stream.on('close', () => {
      console.log('Schema uploaded');
      
      // 执行 prisma db push
      const cmd2 = 'docker exec evolution-whatsapp-backend-1 npx prisma db push --accept-data-loss 2>&1';
      conn.exec(cmd2, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.on('close', () => {
          console.log('Prisma:', out.substring(0, 200));
          
          // 重启后端
          conn.exec('docker restart evolution-whatsapp-backend-1', (err, stream) => {
            stream.on('close', () => {
              console.log('Backend restarted');
              conn.end();
            });
          });
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
