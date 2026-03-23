const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  const frontendDir = '/opt/evolution-whatsapp/evolution-whatsapp/frontend';
  
  const cmds = [
    'cd ' + frontendDir,
    'npm install',
    'npm run build',
    'cp -r dist/* /usr/share/nginx/html/',
    'docker restart evolution-whatsapp-nginx-1'
  ].join(' && ');
  
  console.log('Building in:', frontendDir);
  
  conn.exec(cmds, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', (data) => process.stdout.write(data));
    stream.stderr.on('data', (data) => process.stdout.write(data));
    stream.on('close', (code) => {
      console.log('\nDone! Exit code:', code);
      conn.end();
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
