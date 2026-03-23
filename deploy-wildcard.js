const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 使用通配符找到正确的目录
  conn.exec('cd /opt/evolution-whatsapp/evolution-whatsapp*frontend 2>/dev/null && pwd', (err, stream) => {
    let path = '';
    stream.on('data', (data) => path += data.toString().trim());
    stream.on('close', (code) => {
      if (!path) {
        console.log('Directory not found, trying alternative...');
        // 尝试直接构建
        buildAndDeploy();
      } else {
        console.log('Found dir:', path);
        buildAndDeploy(path);
      }
    });
  });
  
  function buildAndDeploy(dir) {
    let cmds;
    if (dir) {
      cmds = [
        'cd "' + dir + '"',
        'npm install',
        'npm run build',
        'cp -r dist/* /usr/share/nginx/html/',
        'docker restart evolution-whatsapp-nginx-1'
      ].join(' && ');
    } else {
      // 直接在 /opt/evolution-whatsapp 下找 package.json
      cmds = [
        'cd /opt/evolution-whatsapp',
        'ls -la evolution*frontend/package.json 2>/dev/null && cd evolution*frontend || echo "No frontend found"',
        'npm install 2>/dev/null || echo "npm install failed"',
        'npm run build 2>/dev/null || echo "build failed"',
        'cp -r dist/* /usr/share/nginx/html/ 2>/dev/null || echo "copy failed"',
        'docker restart evolution-whatsapp-nginx-1'
      ].join(' ; ');
    }
    
    conn.exec(cmds, (err, stream) => {
      if (err) { console.error(err); conn.end(); return; }
      stream.on('data', (data) => process.stdout.write(data));
      stream.stderr.on('data', (data) => process.stdout.write(data));
      stream.on('close', (code) => {
        console.log('\nDone! Exit code:', code);
        conn.end();
      });
    });
  }
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
