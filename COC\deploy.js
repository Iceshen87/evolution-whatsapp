const { Client } = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');

const sftp = new Client();

const config = {
  host: '47.236.151.168',
  port: 22,
  username: 'admin',
  password: 'Teck0358'
};

const localDistPath = path.join(__dirname, 'dist');

async function deploy() {
  console.log('Connecting to server...');

  try {
    await sftp.connect(config);
    console.log('Connected!');

    // Upload dist folder
    console.log('Uploading files...');

    // First ensure the remote directory exists
    try {
      await sftp.mkdir('/var/www/coc-clan-hub', true);
    } catch (e) {
      // Directory might already exist
    }

    // Upload all files from dist
    const localFiles = fs.readdirSync(localDistPath);
    for (const file of localFiles) {
      const localPath = path.join(localDistPath, file);
      const stat = fs.statSync(localPath);

      if (stat.isDirectory()) {
        const remotePath = `/var/www/coc-clan-hub/${file}`;
        console.log(`Uploading directory: ${file}...`);

        // Create remote directory
        try {
          await sftp.mkdir(remotePath, true);
        } catch (e) {}

        // Upload all files in directory
        const subFiles = fs.readdirSync(localPath);
        for (const subFile of subFiles) {
          const subLocalPath = path.join(localPath, subFile);
          await sftp.put(subLocalPath, `${remotePath}/${subFile}`);
        }
      } else {
        console.log(`Uploading file: ${file}...`);
        await sftp.put(localPath, `/var/www/coc-clan-hub/${file}`);
      }
    }

    console.log('Deployment complete!');
    console.log('Website should be available at: http://47.236.151.168');

  } catch (err) {
    console.error('Deployment failed:', err.message);
  } finally {
    sftp.end();
  }
}

deploy();
