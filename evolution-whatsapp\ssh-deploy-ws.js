const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== SSH Connected ===\n');
    
    let step = 0;
    
    function exec(cmd, cb) {
        console.log(`\n[${++step}] ${cmd.substring(0, 60)}...`);
        conn.exec(cmd, (err, stream) => {
            if (err) { console.error('Error:', err); if (cb) cb(); return; }
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stdout.write(d.toString()));
            stream.on('close', () => { console.log(`[${step}] Done`); if (cb) cb(); });
        });
    }
    
    // 步骤 1: 安装 ws 依赖
    exec("cd /opt/evolution-whatsapp/backend && npm install ws @types/ws --save", () => {
        
        // 步骤 2: 重建后端
        exec("cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml build backend", () => {
            
            // 步骤 3: 重启服务
            exec("cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d", () => {
                
                console.log('\n=== 部署完成 ===');
                console.log('请刷新 http://8.222.170.254 尝试绑定 WhatsApp');
                conn.end();
            });
        });
    });
});

conn.on('error', err => {
    console.error('SSH Error:', err.message);
    process.exit(1);
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
