const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  conn.exec('ls -la /opt/evolution-whatsapp/ | grep frontend', (err, stream) => {
    stream.on('data', (data) => console.log('Found:', data.toString()));
    stream.on('close', () => {
      // 检查带 evolution-whatsapp 的路径
      conn.exec('find /opt/evolution-whatsapp -name "frontend" -type d 2>/dev/null', (err, stream) => {
        stream.on('data', (data) => console.log('Frontend path:', data.toString()));
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
