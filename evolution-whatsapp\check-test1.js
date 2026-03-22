const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 检查 test_1 实例状态 ===\n');
    
    // 获取实例列表
    conn.exec('curl -s http://localhost:8080/instance/fetchInstances -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
        let output = '';
        stream.on('data', (d) => output += d.toString());
        stream.on('close', () => {
            console.log('All instances:');
            try {
                const instances = JSON.parse(output);
                console.log(JSON.stringify(instances, null, 2));
                
                // 查找 test_1
                const test1 = instances.find(i => i.name === 'test_1' || i.instanceName === 'test_1');
                if (test1) {
                    console.log('\nFound test_1:', JSON.stringify(test1, null, 2));
                } else {
                    console.log('\ntest_1 not found in Evolution API');
                }
            } catch (e) {
                console.log(output);
            }
            
            // 直接尝试获取 test_1 的连接状态
            console.log('\n=== 尝试获取 test_1 状态 ===');
            conn.exec('curl -s http://localhost:8080/instance/connectionState/test_1 -H "apikey: 684de76250938ef254f136318374608b"', (err, stream) => {
                let output2 = '';
                stream.on('data', (d) => output2 += d.toString());
                stream.on('close', () => {
                    console.log('Connection state:', output2 || '(empty)');
                    conn.end();
                });
            });
        });
    });
});

conn.on('error', (err) => console.error('Error:', err.message));

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
