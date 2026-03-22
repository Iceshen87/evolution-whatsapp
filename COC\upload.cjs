const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '47.236.151.168',
  port: 22,
  username: 'admin',
  password: 'Teck0358'
};

const localDistPath = path.join(__dirname, 'dist');

conn.on('ready', () => {
  console.log('Connected to server!');

  // Create remote directory
  conn.exec('mkdir -p /var/www/coc-clan-hub', (err, stream) => {
    if (err) {
      console.error('Failed to create directory:', err);
      conn.end();
      return;
    }

    stream.on('close', () => {
      console.log('Directory ready, uploading files...');
      uploadFiles();
    });
  });
});

function uploadFiles() {
  const localFiles = fs.readdirSync(localDistPath);
  let uploaded = 0;

  for (const file of localFiles) {
    const localPath = path.join(localDistPath, file);
    const remotePath = `/var/www/coc-clan-hub/${file}`;

    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      // Create remote directory
      conn.exec(`mkdir -p ${remotePath}`, (err, stream) => {
        stream.on('close', () => {
          // Upload subfiles
          const subFiles = fs.readdirSync(localPath);
          let subUploaded = 0;

          for (const subFile of subFiles) {
            const subLocalPath = path.join(localPath, subFile);
            conn.sftp((err, sftp) => {
              sftp.fastPut(subLocalPath, `${remotePath}/${subFile}`, {}, (err) => {
                if (err) console.error(`Error uploading ${subFile}:`, err);
                subUploaded++;
                if (subUploaded === subFiles.length) {
                  console.log(`Uploaded directory: ${file}`);
                  checkDone();
                }
              });
            });
          }
        });
      });
    } else {
      conn.sftp((err, sftp) => {
        sftp.fastPut(localPath, remotePath, {}, (err) => {
          if (err) console.error(`Error uploading ${file}:`, err);
          else console.log(`Uploaded: ${file}`);
          checkDone();
        });
      });
    }
  }

  let totalDone = 0;
  function checkDone() {
    totalDone++;
    if (totalDone === localFiles.length) {
      console.log('\nDeployment complete!');
      console.log('Website available at: http://47.236.151.168');
      conn.end();
    }
  }
}

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

console.log('Connecting to 47.236.151.168...');
conn.connect(config);
