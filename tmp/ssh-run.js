const { Client } = require('ssh2');

const cmd = process.argv[2];
if (!cmd) { console.error('Usage: node ssh-run.js "command"'); process.exit(1); }

const conn = new Client();
conn.on('ready', () => {
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error('Exec error:', err); conn.end(); process.exit(1); }
    let stdout = '', stderr = '';
    stream.on('close', (code) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      conn.end();
      process.exit(code || 0);
    });
    stream.on('data', (data) => { stdout += data; });
    stream.stderr.on('data', (data) => { stderr += data; });
  });
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({
  host: '8.222.213.209',
  port: 22,
  username: 'root',
  password: 'Teck0358',
  readyTimeout: 15000
});
