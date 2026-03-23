const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 检查后端日志
  conn.exec('docker logs --tail 30 evolution-whatsapp-backend-1', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => {
      console.log('\n--- Container status ---');
      conn.exec('docker ps', (err, stream) => {
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
