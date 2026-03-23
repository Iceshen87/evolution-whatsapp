const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected');
  // 在容器内直接启动 node
  conn.exec('docker exec -d evolution-whatsapp-backend-1 node dist/main.js', (err, stream) => {
    stream.on('close', () => {
      console.log('Started node');
      setTimeout(() => {
        conn.exec('curl -s http://localhost:3000/api/pos/stats', (err, stream) => {
          stream.on('data', d => process.stdout.write(d));
          stream.on('close', () => conn.end());
        });
      }, 5000);
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
