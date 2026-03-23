const { Client } = require('ssh2');

const conn = new Client();
let output = '';

conn.on('ready', () => {
  console.log('SSH connected');
  
  const commands = [
    'cd /opt/evolution-whatsapp',
    'git stash',
    'git pull origin main',
    'cd frontend',
    'npm install',
    'npm run build',
    'cp -r dist/* /usr/share/nginx/html/',
    'docker restart evolution-whatsapp-nginx-1'
  ].join(' && ');
  
  conn.exec(commands, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    }).on('close', () => {
      console.log('\nDone!');
      conn.end();
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
