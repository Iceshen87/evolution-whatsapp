const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 读取 schema
  const schema = fs.readFileSync('backend/prisma/schema.prisma');
  
  // 上传 schema
  const uploadCmd = `echo "${schema.toString('base64')}" | base64 -d > /opt/evolution-whatsapp/backend/prisma/schema.prisma`;
  
  conn.exec(uploadCmd, (err, stream) => {
    stream.on('close', () => {
      console.log('Schema uploaded');
      
      // 在容器内执行 prisma db push
      conn.exec('docker exec evolution-whatsapp-backend-1 sh -c "cd /app && npx prisma db push --accept-data-loss 2>&1"', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', () => {
          console.log('Prisma output:', output);
          
          // 重启后端
          conn.exec('docker restart evolution-whatsapp-backend-1', (err, stream) => {
            stream.on('close', () => {
              console.log('Backend restarted');
              
              // 等待
              setTimeout(() => {
                // 测试
                conn.exec('curl -s http://localhost:3000/api/pos/stats', (err, stream) => {
                  stream.on('data', d => process.stdout.write(d));
                  stream.on('close', () => {
                    console.log('\nTest complete');
                    conn.end();
                  });
                });
              }, 15000);
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
