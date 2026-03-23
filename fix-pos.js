const { Client } = require('ssh2');

const SERVER = {
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358',
  tryKeyboard: true
};

function runSSH(commands) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    
    conn.on('ready', () => {
      conn.exec(commands, (err, stream) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }
        stream.on('close', () => {
          conn.end();
          resolve(output);
        }).on('data', (data) => {
          output += data.toString();
        }).stderr.on('data', (data) => {
          output += data.toString();
        });
      });
    }).on('keyboard-interactive', (_name, _instructions, _lang, prompts, finish) => {
      finish([SERVER.password]);
    }).on('error', reject);
    
    conn.connect(SERVER);
  });
}

async function main() {
  console.log('=== 检查后端日志 ===\n');
  const logs = await runSSH('docker logs --tail 30 evolution-whatsapp-backend-1 2>&1');
  console.log(logs);
  
  console.log('\n=== 再次测试 POS 接口 ===\n');
  const test = await runSSH('curl -s "http://localhost/api/pos/send?number=60125600315&type=text&message=hello&instance_id=131A4DAC3D9B4&access_token=75a65a1b69b24"');
  console.log('响应:', test);
}

main().catch(console.error);
