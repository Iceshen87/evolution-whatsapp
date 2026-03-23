const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 检查容器状态
  conn.exec('docker ps -a', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => {
      // 尝试重启所有容器
      conn.exec('docker start $(docker ps -aq)', (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => {
          console.log('Containers restarted');
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
