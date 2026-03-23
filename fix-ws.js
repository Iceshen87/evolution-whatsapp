const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 修复 WebSocket 依赖 ===\n');
    
    // 1. 读取并更新 package.json
    conn.exec("cd /opt/evolution-whatsapp/backend && cat package.json", (err, stream) => {
        let pkg = '';
        stream.on('data', d => pkg += d);
        stream.on('close', () => {
            console.log('当前 package.json:', pkg.substring(0, 300));
            
            // 添加 ws 依赖
            const cmd = `cd /opt/evolution-whatsapp/backend && sed -i 's/"uuid": "\\^11.1.0"/"uuid": "\\^11.1.0",\n    "ws": "\\^8.18.0"/' package.json && sed -i 's/"@types\\/uuid": "\\^10.0.0"/"@types\\/uuid": "\\^10.0.0",\n    "@types\\/ws": "\\^8.5.14"/' package.json`;
            
            conn.exec(cmd, (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n依赖已添加');
                    
                    // 验证
                    conn.exec("cat /opt/evolution-whatsapp/backend/package.json | grep -E '\"ws\"|\"@types/ws\"'", (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n完成');
                            conn.end();
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', err => {
    console.error('SSH Error:', err.message);
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
