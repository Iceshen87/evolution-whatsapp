const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Testing manager paths...\n');
    
    // 测试 /manager/
    conn.exec('curl -sL http://localhost:8080/manager/ 2>&1 | head -30', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n\nTesting root path:');
            conn.exec('curl -s http://localhost:8080/ 2>&1 | head -20', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    conn.end();
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
