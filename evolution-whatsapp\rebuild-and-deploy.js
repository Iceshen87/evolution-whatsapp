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
    console.log('=== 重新构建并部署前端 ===');
    
    // 进入项目目录并重建前端
    exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml build frontend', '构建前端', () => {
        
        // 重启服务
        exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d', '重启服务', () => {
            
            console.log('\n等待 10 秒...');
            setTimeout(() => {
                // 检查状态
                exec('docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml ps', '检查服务状态', () => {
                    console.log('\n=== 部署完成 ===');
                    console.log('请刷新页面 http://8.222.170.254 查看更新');
                    conn.end();
                });
            }, 10000);
        });
    });
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
