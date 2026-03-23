const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // Step 1: 创建目录
  conn.exec('mkdir -p frontend/src/pages frontend/src/components frontend/public frontend/dist/assets && echo "Dirs created"', (err, stream) => {
    stream.on('data', (data) => process.stdout.write(data));
    stream.on('close', () => {
      console.log('\nStep 1: Directories created');
      conn.end();
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
