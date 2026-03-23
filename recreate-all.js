const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 删除旧的 nginx 并用 docker-compose 重建
  conn.exec('docker rm -f evolution-whatsapp-nginx-1 && cd /opt/evolution-whatsapp && docker compose up -d nginx', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stdout.write(d));
    stream.on('close', (code) => {
      console.log('\nExit code:', code);
      // 检查状态
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
