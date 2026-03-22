const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '47.236.151.160',
  port: 22,
  username: 'admin',
  password: 'Teck0358',
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('Connected!');
  
  conn.exec('ps aux | grep node | grep -v grep; echo "---"; cat /home/admin/coc-hub/server.log 2>/dev/null | tail -5', (err, stream) => {
    stream.on('data', (data) => {
      console.log(data.toString());
    }).on('close', () => {
      conn.end();
    });
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

conn.connect(config);
