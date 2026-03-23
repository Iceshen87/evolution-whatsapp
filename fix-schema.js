const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  const schema = fs.readFileSync('backend/prisma/schema.prisma');
  const cmd = `echo "${schema.toString('base64')}" | base64 -d > /opt/evolution-whatsapp/backend/prisma/schema.prisma`;
  
  conn.exec(cmd, (err, stream) => {
    stream.on('close', () => {
      console.log('Schema uploaded');
      conn.exec('docker restart evolution-whatsapp-backend-1', (err, stream) => {
        stream.on('close', () => {
          console.log('Backend restarted');
          conn.end();
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
