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
  
  // Start server with nohup
  const cmd = 'cd /home/admin/coc-hub && nohup node server/proxy.js > server.log 2>&1 &';
  
  console.log('Starting server...');
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Error:', err);
      conn.end();
      return;
    }
    
    stream.on('close', () => {
      // Check if server is running
      setTimeout(() => {
        conn.exec('ps aux | grep "node server/proxy.js" | grep -v grep', (err, stream) => {
          stream.on('data', (data) => {
            console.log('Server process:\n' + data.toString());
          }).on('close', () => {
            conn.exec('curl -s http://localhost:3001/site/war-challenges || echo "Server not responding"', (err, stream) => {
              stream.on('data', (data) => {
                console.log('API test:\n' + data.toString());
              }).on('close', () => {
                console.log('\n========================================');
                console.log('Server started!');
                console.log('Check status: ssh admin@47.236.151.160 "ps aux | grep node"');
                console.log('View logs: ssh admin@47.236.151.160 "cat /home/admin/coc-hub/server.log"');
                console.log('========================================');
                conn.end();
              });
            });
          });
        });
      }, 3000);
    });
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

console.log('Connecting to 47.236.151.160...');
conn.connect(config);
