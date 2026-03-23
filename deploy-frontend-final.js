const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  const html = fs.readFileSync('frontend/dist/index.html');
  const cmd1 = `echo "${html.toString('base64')}" | base64 -d > /tmp/index.html && docker cp /tmp/index.html evolution-whatsapp-nginx-1:/usr/share/nginx/html/index.html`;
  
  conn.exec(cmd1, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => {
      console.log('index.html uploaded');
      
      const js = fs.readFileSync('frontend/dist/assets/index-DR20gh5d.js');
      const cmd2 = `echo "${js.toString('base64')}" | base64 -d > /tmp/app.js && docker cp /tmp/app.js evolution-whatsapp-nginx-1:/usr/share/nginx/html/assets/index-DR20gh5d.js`;
      
      conn.exec(cmd2, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('close', () => {
          console.log('JS uploaded');
          
          conn.exec('docker restart evolution-whatsapp-nginx-1', (err, stream) => {
            stream.on('close', () => {
              console.log('nginx restarted');
              conn.end();
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
