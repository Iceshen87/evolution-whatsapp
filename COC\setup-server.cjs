const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '47.236.151.160',
  port: 22,
  username: 'admin',
  password: 'Teck0358',
  readyTimeout: 30000
};

const commands = [
  'cd /home/admin/coc-hub && npm install --production',
  'mkdir -p /home/admin/coc-hub/server/data',
  'cp /home/admin/coc-hub/.env.example /home/admin/coc-hub/.env',
];

conn.on('ready', () => {
  console.log('Connected to server!');
  
  let i = 0;
  
  function runNext() {
    if (i >= commands.length) {
      console.log('\n========================================');
      console.log('Setup complete!');
      console.log('Next: Start server with: cd /home/admin/coc-hub && node server/proxy.js');
      console.log('========================================');
      conn.end();
      return;
    }
    
    const cmd = commands[i];
    console.log(`\nRunning: ${cmd}`);
    i++;
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('Error:', err);
        runNext();
        return;
      }
      
      stream.on('data', (data) => {
        console.log(data.toString());
      }).on('close', () => {
        runNext();
      });
    });
  }
  
  runNext();
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

console.log('Connecting to 47.236.151.160...');
conn.connect(config);
