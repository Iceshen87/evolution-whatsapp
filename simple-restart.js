const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected');
  conn.exec('docker restart evolution-whatsapp-backend-1 && echo done', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
