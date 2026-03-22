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

const localPath = path.join(__dirname);
const remotePath = '/home/admin/coc-hub';

const filesToUpload = [
  'package.json',
  'package-lock.json',
  '.env.example',
];

conn.on('ready', () => {
  console.log('Connected to server!');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    let uploaded = 0;
    filesToUpload.forEach(file => {
      const localFile = path.join(localPath, file);
      const remoteFile = `${remotePath}/${file}`;
      
      console.log(`Uploading ${file}...`);
      sftp.fastPut(localFile, remoteFile, err => {
        if (err) console.error(`Error uploading ${file}:`, err.message);
        else console.log(`Uploaded: ${file}`);
        uploaded++;
        if (uploaded === filesToUpload.length) {
          console.log('\n========================================');
          console.log('All files uploaded successfully!');
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
