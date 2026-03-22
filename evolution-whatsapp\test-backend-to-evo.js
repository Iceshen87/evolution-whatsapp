const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 测试后端连接到 Evolution API ===\n');
    
    // 在后端容器内测试连接
    conn.exec('docker exec evolution-whatsapp-backend-1 sh -c "curl -s http://evolution-api:8080 -H \\"apikey: 684de76250938ef254f136318374608b\\" | head -100"', (err, stream) => {
        let output = '';
        stream.on('data', d => { output += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n\n后端连接测试结果:', output ? '成功' : '失败');
            
            // 测试创建实例
            console.log('\n测试创建实例:');
            conn.exec('docker exec evolution-whatsapp-backend-1 sh -c \'curl -s -X POST http://evolution-api:8080/instance/create -H "apikey: 684de76250938ef254f136318374608b" -H "Content-Type: application/json" -d \'\'\'{\"instanceName\":\"test_1\",\"integration\":\"WHATSAPP-BAILEYS\",\"qrcode\":true}\'\'\' | head -200\'', (err, stream) => {
                let output2 = '';
                stream.on('data', d => { output2 += d; process.stdout.write(d.toString()); });
                stream.on('close', () => {
                    console.log('\n创建实例结果:', output2 || '(empty)');
                    conn.end();
                });
            });
        });
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
