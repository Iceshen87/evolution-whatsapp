const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '47.236.151.160',
  port: 22,
  username: 'root',
  password: 'Teck0358',
  readyTimeout: 30000
};

conn.on('ready', () => {
  console.log('Connected!');
  
  conn.exec('cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/nginx.conf | head -100', (err, stream) => {
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
