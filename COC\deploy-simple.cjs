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

const localDistPath = path.join(__dirname, 'dist');
const remotePath = '/home/admin/coc-hub';

conn.on('ready', () => {
  console.log('Connected to server!');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    // Create remote directory
    sftp.mkdir(remotePath, err => {
      // Ignore error if directory exists
    });

    // Upload index.html
    console.log('Uploading index.html...');
    sftp.fastPut(
      path.join(localDistPath, 'index.html'),
      `${remotePath}/index.html`,
      err => {
        if (err) console.error('Error uploading index.html:', err.message);
        else console.log('Uploaded: index.html');
      }
    );

    // Create assets directory
    sftp.mkdir(`${remotePath}/assets`, err => {});

    // Upload assets
    const assetsDir = path.join(localDistPath, 'assets');
    const assets = fs.readdirSync(assetsDir);
    
    assets.forEach(file => {
      const localFile = path.join(assetsDir, file);
      const remoteFile = `${remotePath}/assets/${file}`;
      console.log(`Uploading assets/${file}...`);
      sftp.fastPut(localFile, remoteFile, err => {
        if (err) console.error(`Error uploading assets/${file}:`, err.message);
        else console.log(`Uploaded: assets/${file}`);
      });
    });

    // Wait a bit then close
    setTimeout(() => {
      console.log('\n========================================');
      console.log('Deployment complete!');
      console.log('Website should be available at: http://47.236.151.160');
      console.log('Note: You may need to configure nginx to serve from /home/admin/coc-hub');
      console.log('========================================');
      conn.end();
    }, 10000);
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

console.log('Connecting to 47.236.151.160...');
conn.connect(config);
