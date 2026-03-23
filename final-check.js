const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected');
  conn.exec('docker ps | grep backend', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => {
      console.log('\n--- Logs ---');
      conn.exec('docker logs --tail 10 evolution-whatsapp-backend-1', (err, stream) => {
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
