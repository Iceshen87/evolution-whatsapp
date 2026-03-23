const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 检查正确的 frontend 路径
  conn.exec('ls /opt/evolution-whatsapp/evolution-whatsapp/frontend/src/ 2>/dev/null | head -1', (err, stream) => {
    let result = '';
    stream.on('data', (data) => result += data.toString());
    stream.on('close', () => {
      const frontendDir = result.trim() 
        ? '/opt/evolution-whatsapp/evolution-whatsapp/frontend'
        : '/opt/evolution-whatsapp/frontend';
      
      console.log('Using frontend dir:', frontendDir);
      
      const cmds = [
        'cd ' + frontendDir,
        'npm install',
        'npm run build',
        'cp -r dist/* /usr/share/nginx/html/',
        'docker restart evolution-whatsapp-nginx-1'
      ].join(' && ');
      
      conn.exec(cmds, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', (data) => process.stdout.write(data));
        stream.stderr.on('data', (data) => process.stdout.write(data));
        stream.on('close', (code) => {
          console.log('\nDone! Exit code:', code);
          conn.end();
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
