const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '47.236.151.160',
  port: 22,
  username: 'root',
  password: 'Teck0358'
};

const remoteDir = '/root/COC';

// Helper function to walk directory
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath, stat);
    }
  }
}

// Helper function to ensure remote directory exists
async function ensureRemoteDir(sftp, remotePath) {
  const dir = path.dirname(remotePath);
  try {
    await sftp.mkdir(dir, true);
  } catch (e) {
    // Directory might already exist
  }
}

conn.on('ready', async () => {
  console.log('=== COC Hub Deployment Script ===');
  console.log('');
  console.log('[1/5] Connected to server!');
  console.log('[2/5] Creating remote directory...');

  // Create remote directories
  conn.exec(`mkdir -p ${remoteDir}/dist ${remoteDir}/server`, async (err, stream) => {
    if (err) {
      console.error('Failed to create directory:', err);
      conn.end();
      return;
    }

    stream.on('close', async () => {
      console.log('[3/5] Uploading dist folder...');
      
      conn.sftp(async (err, sftp) => {
        if (err) {
          console.error('SFTP error:', err);
          conn.end();
          return;
        }

        try {
          // Upload dist folder
          const distFiles = [];
          walkDir('dist', (filePath) => {
            const relativePath = path.relative('dist', filePath);
            distFiles.push({ local: filePath, remote: `${remoteDir}/dist/${relativePath}` });
          });

          for (const file of distFiles) {
            await ensureRemoteDir(sftp, file.remote);
            await sftp.fastPut(file.local, file.remote);
            console.log(`  Uploaded: ${path.relative('dist', file.local)}`);
          }
          console.log(`  ${distFiles.length} files uploaded from dist/`);

          // Upload server folder
          console.log('[4/5] Uploading server folder...');
          const serverFiles = [];
          walkDir('server', (filePath) => {
            const relativePath = path.relative('server', filePath);
            serverFiles.push({ local: filePath, remote: `${remoteDir}/server/${relativePath}` });
          });

          for (const file of serverFiles) {
            await ensureRemoteDir(sftp, file.remote);
            await sftp.fastPut(file.local, file.remote);
            console.log(`  Uploaded: ${path.relative('server', file.local)}`);
          }
          console.log(`  ${serverFiles.length} files uploaded from server/`);

          // Upload config files
          console.log('[5/5] Uploading config files...');
          await sftp.fastPut('package.json', `${remoteDir}/package.json`);
          console.log('  Uploaded: package.json');
          
          try {
            await sftp.fastPut('.env', `${remoteDir}/.env`);
            console.log('  Uploaded: .env');
          } catch (e) {
            await sftp.fastPut('.env.example', `${remoteDir}/.env.example`);
            console.log('  Uploaded: .env.example (请登录服务器后配置 .env)');
          }

          sftp.end();

          // Install dependencies and start server
          console.log('');
          console.log('Installing dependencies and starting server...');
          conn.exec(`cd ${remoteDir} && npm install --production`, (err, stream) => {
            if (err) {
              console.error('Install error:', err);
              conn.end();
              return;
            }
            
            let stdout = '';
            let stderr = '';
            stream.on('data', (data) => { stdout += data; });
            stream.stderr.on('data', (data) => { stderr += data; });
            
            stream.on('close', (code) => {
              if (code === 0) {
                console.log('Dependencies installed successfully!');
                
                // Start server in background
                conn.exec(`cd ${remoteDir} && pkill -f "node server/proxy.js" 2>/dev/null; nohup node server/proxy.js > server.log 2>&1 &`, (err, stream) => {
                  if (err) {
                    console.error('Start server error:', err);
                    conn.end();
                    return;
                  }
                  
                  stream.on('close', () => {
                    console.log('');
                    console.log('=== Deployment Complete! ===');
                    console.log(`Frontend: http://${config.host}`);
                    console.log(`API: http://${config.host}:3001`);
                    console.log('');
                    console.log('Note: 请确保服务器上已配置 .env 文件和 PostgreSQL 数据库');
                    conn.end();
                  });
                });
              } else {
                console.error('Install failed:', stderr);
                conn.end();
              }
            });
          });

        } catch (uploadErr) {
          console.error('Upload error:', uploadErr);
          sftp.end();
          conn.end();
        }
      });
    });
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

console.log('Connecting to server...');
conn.connect(config);
