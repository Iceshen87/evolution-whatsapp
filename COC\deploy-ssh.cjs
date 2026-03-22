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

  // Create remote directory
  conn.exec(`mkdir -p ${remotePath}`, (err, stream) => {
    if (err) {
      console.error('Failed to create directory:', err);
      conn.end();
      return;
    }

    stream.on('close', (code, signal) => {
      console.log('Directory ready, starting upload...');
      uploadAllFiles();
    }).on('data', (data) => {}).stderr.on('data', (data) => {});
  });
});

function uploadAllFiles() {
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    const files = fs.readdirSync(localDistPath);
    let completed = 0;
    let total = 0;

    // Count total files
    files.forEach(file => {
      const localPath = path.join(localDistPath, file);
      if (fs.statSync(localPath).isDirectory()) {
        const subFiles = fs.readdirSync(localPath);
        total += subFiles.length;
      } else {
        total++;
      }
    });

    console.log(`Total files to upload: ${total}`);

    files.forEach(file => {
      const localPath = path.join(localDistPath, file);
      const stat = fs.statSync(localPath);

      if (stat.isDirectory()) {
        // Create remote subdirectory
        conn.exec(`mkdir -p ${remotePath}/${file}`, (err, stream) => {
          stream.on('close', () => {
            const subFiles = fs.readdirSync(localPath);
            subFiles.forEach(subFile => {
              const subLocalPath = path.join(localPath, subFile);
              const subRemotePath = `${remotePath}/${file}/${subFile}`;
              
              sftp.fastPut(subLocalPath, subRemotePath, (err) => {
                if (err) {
                  console.error(`Error uploading ${file}/${subFile}:`, err.message);
                } else {
                  console.log(`Uploaded: ${file}/${subFile}`);
                }
                completed++;
                if (completed === total) {
                  console.log('\n========================================');
                  console.log('Deployment complete!');
                  console.log('Website: http://47.236.151.160');
                  console.log('========================================');
                  conn.end();
                }
              });
            });
          });
        });
      } else {
        const fileRemotePath = `${remotePath}/${file}`;
        sftp.fastPut(localPath, fileRemotePath, (err) => {
          if (err) {
            console.error(`Error uploading ${file}:`, err.message);
          } else {
            console.log(`Uploaded: ${file}`);
          }
          completed++;
          if (completed === total) {
            console.log('\n========================================');
            console.log('Deployment complete!');
            console.log('Website: http://47.236.151.160');
            console.log('========================================');
            conn.end();
          }
        });
      }
    });
  });
}

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

console.log('Connecting to 47.236.151.160...');
conn.connect(config);
