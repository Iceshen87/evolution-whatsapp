const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 重启后端
  conn.exec('docker restart evolution-whatsapp-backend-1 && sleep 10 && docker logs --tail 10 evolution-whatsapp-backend-1', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => {
      // 测试后端
      console.log('\n--- Testing backend ---');
      conn.exec('curl -s http://localhost:3000/api/web/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"Admin@20260321"}\'', (err, stream) => {
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
