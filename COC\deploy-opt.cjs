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

conn.on('ready', () => {
  console.log('Connected to server!');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    const remotePath = '/opt/COC-Hub';
    const localDistPath = path.join(__dirname, 'dist');
    const localServerPath = path.join(__dirname, 'server');

    // Upload frontend
    console.log('Uploading index.html...');
    sftp.fastPut(path.join(localDistPath, 'index.html'), `${remotePath}/dist/index.html`, err => {
      if (err) console.error('Error:', err.message);
      else console.log('Uploaded: index.html');
    });

    // Upload assets
    const assets = fs.readdirSync(path.join(localDistPath, 'assets'));
    assets.forEach(file => {
      sftp.fastPut(
        path.join(localDistPath, 'assets', file),
        `${remotePath}/dist/assets/${file}`,
        err => {
          if (err) console.error(`Error: assets/${file}`, err.message);
          else console.log(`Uploaded: assets/${file}`);
        }
      );
    });

    // Upload server files
    const serverFiles = ['proxy.js', 'routes/auth.js', 'routes/admin.js', 'routes/warChallenge.js', 'models/user.js', 'middleware/auth.js', 'db/index.js', 'db/init.sql'];
    serverFiles.forEach(file => {
      const localFile = path.join(localServerPath, file);
      if (fs.existsSync(localFile)) {
        sftp.fastPut(localFile, `${remotePath}/server/${file}`, err => {
          if (err) console.error(`Error: server/${file}`, err.message);
          else console.log(`Uploaded: server/${file}`);
        });
      }
    });

    // Restart server after upload
    setTimeout(() => {
      console.log('\nRestarting server...');
      conn.exec('pkill -f "node.*proxy.js"; sleep 1; cd /opt/COC-Hub && nohup node server/proxy.js > server.log 2>&1 &', (err, stream) => {
        stream.on('close', () => {
          console.log('Server restarted!');
          console.log('\n========================================');
          console.log('Deployment complete!');
          console.log('Website: http://47.236.151.160');
          console.log('========================================');
          conn.end();
        });
      });
    }, 15000);
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

console.log('Connecting to 47.236.151.160...');
conn.connect(config);
