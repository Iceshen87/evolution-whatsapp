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
  console.log('Connected to server!');

  conn.exec('ls -la /home/admin/coc-hub/', (err, stream) => {
    if (err) {
      console.error('Error:', err);
      conn.end();
      return;
    }

    stream.on('close', () => {
      conn.exec('ls -la /home/admin/coc-hub/server/', (err, stream) => {
        stream.on('data', (data) => {
          console.log('Server files:\n' + data.toString());
        }).on('close', () => {
          conn.end();
        });
      });
    }).on('data', (data) => {
      console.log('Project files:\n' + data.toString());
    });
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

console.log('Connecting to 47.236.151.160...');
conn.connect(config);
