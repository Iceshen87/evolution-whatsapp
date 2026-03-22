const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '47.236.151.160',
  port: 22,
  username: 'admin',
  password: 'Teck0358',
  readyTimeout: 30000
};

const localServerPath = path.join(__dirname, 'server');
const remotePath = '/home/admin/coc-hub/server';

const filesToUpload = [
  { local: 'proxy.js', remote: 'proxy.js' },
  { local: 'db/index.js', remote: 'db/index.js' },
  { local: 'db/init.sql', remote: 'db/init.sql' },
  { local: 'routes/auth.js', remote: 'routes/auth.js' },
  { local: 'routes/admin.js', remote: 'routes/admin.js' },
  { local: 'routes/warChallenge.js', remote: 'routes/warChallenge.js' },
  { local: 'models/user.js', remote: 'models/user.js' },
  { local: 'middleware/auth.js', remote: 'middleware/auth.js' },
];

conn.on('ready', () => {
  console.log('Connected to server!');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    // Create directories
    const dirs = [remotePath, `${remotePath}/db`, `${remotePath}/routes`, `${remotePath}/models`, `${remotePath}/middleware`];
    dirs.forEach(dir => {
      sftp.mkdir(dir, err => {});
    });

    // Upload files
    let uploaded = 0;
    filesToUpload.forEach(file => {
      const localFile = path.join(localServerPath, file.local);
      const remoteFile = `${remotePath}/${file.remote}`;
      
      // Ensure parent directory exists
      const parentDir = path.dirname(remoteFile);
      
      console.log(`Uploading server/${file.local}...`);
      sftp.fastPut(localFile, remoteFile, err => {
        if (err) console.error(`Error uploading ${file.local}:`, err.message);
        else console.log(`Uploaded: server/${file.local}`);
        uploaded++;
        if (uploaded === filesToUpload.length) {
          console.log('\n========================================');
          console.log('Server files uploaded!');
          console.log('Next steps:');
          console.log('1. SSH to server: ssh admin@47.236.151.160');
          console.log('2. Copy package.json to server directory');
          console.log('3. Run: npm install');
          console.log('4. Run: node proxy.js');
          console.log('========================================');
          conn.end();
        }
      });
    });
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

console.log('Connecting to 47.236.151.160...');
conn.connect(config);
