const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 测试 WebSocket 端点 ===\n');
    
    // 测试各种可能的 WebSocket 端点
    const endpoints = [
        'ws://localhost:8080/websocket',
        'ws://localhost:8080/ws',
        'ws://localhost:8080/evolutionWS',
        'ws://localhost:8080/',
        'ws://localhost:8080/socket.io',
    ];
    
    let index = 0;
    function testNext() {
        if (index >= endpoints.length) {
            console.log('\n所有端点测试完成');
            conn.end();
            return;
        }
        
        const endpoint = endpoints[index++];
        console.log(`\n测试: ${endpoint}`);
        
        conn.exec(`timeout 3 curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "apikey: 684de76250938ef254f136318374608b" ${endpoint} 2>&1 | head -10`, (err, stream) => {
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.on('close', () => {
                setTimeout(testNext, 1000);
            });
        });
    }
    
    testNext();
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
