const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected');
  conn.exec('ls /opt/evolution-whatsapp/frontend/src/pages/', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).on('error', e => console.error(e)).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
