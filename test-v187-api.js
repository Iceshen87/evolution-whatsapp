const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('测试 v1.8.7 API 端点...\n');
    
    // 测试不同的端点
    const endpoints = [
        '/instance/connectionState/123',
        '/instance/connect/123',
        '/instance/fetchInstances',
    ];
    
    let index = 0;
    
    function testNext() {
        if (index >= endpoints.length) {
            console.log('\n所有测试完成');
            conn.end();
            return;
        }
        
        const endpoint = endpoints[index++];
        console.log(`\n测试: ${endpoint}`);
        conn.exec(`curl -s http://localhost:8080${endpoint} -H "apikey: 684de76250938ef254f136318374608b"`, (err, stream) => {
            stream.on('data', (d) => process.stdout.write(d.toString()));
            stream.on('close', () => testNext());
        });
    }
    
    testNext();
});

conn.on('error', (err) => console.error(err.message));
conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
