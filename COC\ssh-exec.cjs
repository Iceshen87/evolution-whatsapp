const { Client } = require('ssh2');
const fs = require('fs');

const config = {
  host: '43.106.117.4',
  port: 22,
  username: 'root',
  password: 'Teck0358',
  readyTimeout: 30000,
};

const arg = process.argv[2] || 'echo "no command"';
let command;
if (arg.endsWith('.sh') && fs.existsSync(arg)) {
  var scriptContent = fs.readFileSync(arg, 'utf8');
} else {
  command = arg;
}

const conn = new Client();
conn.on('ready', () => {
  if (command) {
    runCommand(command);
  } else {
    conn.sftp((err, sftp) => {
      if (err) { console.error('SFTP ERROR:', err); conn.end(); return; }
      sftp.writeFile('/tmp/_remote_exec.sh', scriptContent, (err) => {
        if (err) { console.error('WRITE ERROR:', err); conn.end(); return; }
        runCommand('bash /tmp/_remote_exec.sh');
      });
    });
  }
}).on('error', (err) => {
  console.error('CONNECTION ERROR:', err.message);
}).connect(config);

function runCommand(cmd) {
  conn.exec(cmd, { pty: true }, (err, stream) => {
    if (err) { console.error('EXEC ERROR:', err); conn.end(); return; }
    let output = '';
    stream.on('close', (code) => {
      console.log(output);
      console.log('EXIT_CODE:' + code);
      conn.end();
    }).on('data', (data) => {
      output += data.toString();
    }).stderr.on('data', (data) => {
      output += data.toString();
    });
  });
}
