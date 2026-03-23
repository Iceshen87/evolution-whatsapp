const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('Connected');
  
  // 检查所有 pages 文件
  conn.exec('find /opt/evolution-whatsapp -name "*.tsx" -path "*pages*" 2>/dev/null', (err, stream) => {
    let output = '';
    stream.on('data', d => output += d);
    stream.on('close', () => {
      console.log('Pages files found:');
      console.log(output);
      conn.end();
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
