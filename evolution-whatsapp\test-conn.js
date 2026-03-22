const { Client } = require('ssh2');

console.log('测试 SSH 连接...');

const conn = new Client();

conn.on('ready', () => {
    console.log('SSH 连接成功!');
    
    conn.exec('echo test', (err, stream) => {
        stream.on('data', (d) => console.log('输出:', d.toString()));
        stream.on('close', () => {
            console.log('测试完成');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.log('SSH 错误:', err.message);
}).on('timeout', () => {
    console.log('连接超时');
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358',
    readyTimeout: 30000,
    timeout: 30000
});
