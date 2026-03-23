const { Client } = require('ssh2');

const conn = new Client();
let step = 0;

function exec(cmd, desc, callback, delay = 0) {
    console.log(`\n[${++step}] ${desc}...`);
    setTimeout(() => {
        conn.exec(cmd, (err, stream) => {
            let out = '';
            stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
            stream.stderr.on('data', d => process.stdout.write(d.toString()));
            stream.on('close', () => {
                console.log(`[${step}] Done`);
                if (callback) callback(out);
            });
        });
    }, delay);
}

conn.on('ready', () => {
    console.log('=== 修复 Evolution API ===');
    
    // 检查 Evolution API 日志
    exec('docker logs --tail=50 evolution-whatsapp-evolution-api-1 2>&1 | grep -E "(error|Error|fail|create)" | tail -20', '检查错误日志', () => {
        
        // 重启 Evolution API
        exec('docker restart evolution-whatsapp-evolution-api-1', '重启 Evolution API', () => {
            
            console.log('\n等待 30 秒...');
            setTimeout(() => {
                
                // 检查是否启动成功
                exec('docker logs --tail=20 evolution-whatsapp-evolution-api-1 | grep -E "(start|error|Migration)"', '检查启动日志', () => {
                    
                    // 测试 API 是否响应
                    exec('curl -s http://localhost:8080 -H "apikey: 684de76250938ef254f136318374608b" | head -100', '测试 API 响应', () => {
                        
                        // 创建 test_1 实例
                        setTimeout(() => {
                            exec(`curl -s -X POST http://localhost:8080/instance/create -H "apikey: 684de76250938ef254f136318374608b" -H "Content-Type: application/json" -d '{"instanceName":"test_1","integration":"WHATSAPP-BAILEYS","qrcode":true}'`, '创建 test_1 实例', (out) => {
                                
                                setTimeout(() => {
                                    // 验证实例创建
                                    exec('curl -s http://localhost:8080/instance/fetchInstances -H "apikey: 684de76250938ef254f136318374608b"', '验证实例列表', () => {
                                        console.log('\n=== 修复完成 ===');
                                        conn.end();
                                    });
                                }, 3000);
                            });
                        }, 2000);
                    });
                });
            }, 30000);
        });
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
