const {Client} = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  conn.exec('echo "=== NGINX CONFIG ===" && cat /etc/nginx/nginx.conf 2>&1 && echo "=== SITES ===" && ls /etc/nginx/conf.d/ 2>&1 && cat /etc/nginx/conf.d/* 2>&1 && echo "=== PNPM ===" && which pnpm 2>&1 && pnpm --version 2>&1 && echo "=== OPENCLAW DIR ===" && ls /usr/lib/node_modules/openclaw/dist/ 2>&1', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let out = '';
    stream.on('data', (d) => { out += d.toString(); });
    stream.stderr.on('data', (d) => { out += d.toString(); });
    stream.on('close', () => { console.log(out); conn.end(); });
  });
}).on('error', (err) => {
  console.error('Connection error:', err.message);
}).connect({
  host: '8.222.213.209',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
