const { Client } = require('ssh2');

console.log('等待 2 分钟后检查服务器...');

setTimeout(() => {
    const conn = new Client();
    
    conn.on('ready', () => {
        console.log('已连接!');
        
        conn.exec('docker ps | grep evolution; curl -s http://localhost:8080 | head -1', (err, stream) => {
            stream.on('data', (d) => console.log(d.toString()));
            stream.on('close', () => conn.end());
        });
    }).on('error', (err) => {
        console.log('连接失败:', err.message);
    });
    
    conn.connect({
        host: '8.222.170.254',
        port: 22,
        username: 'root',
        password: 'Teck0358',
        readyTimeout: 30000
    });
}, 120000);
