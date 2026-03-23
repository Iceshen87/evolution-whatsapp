const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  conn.exec('docker logs --tail 15 evolution-whatsapp-nginx-1', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => {
      console.log('\n--- Testing nginx to backend ---');
      conn.exec('docker exec evolution-whatsapp-nginx-1 curl -s http://evolution-whatsapp-backend-1:3000/api/web/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"Admin@20260321"}\'', (err, stream) => {
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
