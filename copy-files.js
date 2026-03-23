const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 读取并上传 MessageLogs.tsx
  const content = fs.readFileSync('frontend/src/pages/MessageLogs.tsx');
  const base64 = content.toString('base64');
  
  conn.exec(`echo '${base64}' | base64 -d > /opt/evolution-whatsapp/frontend/src/pages/MessageLogs.tsx`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => {
      console.log('MessageLogs.tsx created');
      
      // 更新 Layout.tsx
      const layout = fs.readFileSync('frontend/src/components/Layout.tsx');
      conn.exec(`echo '${layout.toString('base64')}' | base64 -d > /opt/evolution-whatsapp/frontend/src/components/Layout.tsx`, (err, stream) => {
        stream.on('close', () => {
          console.log('Layout.tsx updated');
          
          // 更新 App.tsx
          const app = fs.readFileSync('frontend/src/App.tsx');
          conn.exec(`echo '${app.toString('base64')}' | base64 -d > /opt/evolution-whatsapp/frontend/src/App.tsx`, (err, stream) => {
            stream.on('close', () => {
              console.log('App.tsx updated');
              console.log('All files updated! Now building...');
              
              // 构建前端
              conn.exec('cd /opt/evolution-whatsapp/frontend && npm run build 2>&1', (err, stream) => {
                stream.on('data', d => process.stdout.write(d));
                stream.on('close', () => {
                  console.log('Build done! Copying to nginx...');
                  
                  conn.exec('cp -r /opt/evolution-whatsapp/frontend/dist/* /usr/share/nginx/html/ && docker restart evolution-whatsapp-nginx-1', (err, stream) => {
                    stream.on('close', () => {
                      console.log('Deployment complete!');
                      conn.end();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
