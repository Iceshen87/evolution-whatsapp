import { Client } from 'ssh2';

const conn = new Client();
const commands = [
  // 获取第一个 USER node 的行号并在其前插入 sudo
  'cd /root/openclaw && LINE=$(grep -n "^USER node$" Dockerfile | head -1 | cut -d: -f1) && sed -i "${LINE}i\\# Install sudo for node user\\nRUN apt-get update && apt-get install -y --no-install-recommends sudo && echo \\"node ALL=(ALL) NOPASSWD:ALL\\" >> /etc/sudoers && apt-get clean && rm -rf /var/lib/apt/lists/*" Dockerfile && grep "NOPASSWD" Dockerfile',
  // 重新构建
  'cd /root/openclaw && docker build --build-arg OPENCLAW_INSTALL_BROWSER=1 -t openclaw:local . 2>&1 | tail -10',
  // 重启
  'cd /root/openclaw && docker compose down && docker compose up -d 2>&1 | tail -5',
  'sleep 8',
  // 验证
  'docker exec openclaw-openclaw-gateway-1 sudo whoami',
  'docker logs --since 10s openclaw-openclaw-gateway-1 2>&1 | grep -i "listening\\|started\\|ready" | tail -5'
];

let cmdIndex = 0;

conn.on('ready', () => {
  console.log('SSH Connected');
  function runNextCommand() {
    if (cmdIndex >= commands.length) { console.log('\nDone'); conn.end(); return; }
    const cmd = commands[cmdIndex++];
    console.log(`\n>>> ${cmd.substring(0, 80)}...`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error(err); runNextCommand(); return; }
      stream.on('close', () => runNextCommand())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
  }
  runNextCommand();
});

conn.on('error', (err) => { console.error(err.message); process.exit(1); });
conn.connect({ host: '47.86.160.135', port: 22, username: 'root', password: 'Teck0358!' });
