const {Client} = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  conn.exec('cd /tmp/openclaw-src/ui && pnpm install --no-frozen-lockfile 2>&1', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let out = '';
    stream.on('data', (d) => { out += d.toString(); });
    stream.stderr.on('data', (d) => { out += d.toString(); });
    stream.on('close', (code) => { console.log(out); console.log('Exit code:', code); conn.end(); });
  });
}).on('error', (err) => {
  console.error('Connection error:', err.message);
}).connect({
  host: '8.222.213.209',
  port: 22,
  username: 'root',
  password: 'Teck0358',
  readyTimeout: 30000,
  keepaliveInterval: 10000
});
