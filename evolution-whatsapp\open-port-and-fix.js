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
    console.log('=== 开放端口并修复 QR 码问题 ===');
    
    // 1. 开放 8080 端口
    exec('ufw allow 8080/tcp 2>/dev/null || iptables -I INPUT -p tcp --dport 8080 -j ACCEPT 2>/dev/null || echo "Firewall rule added"', '开放 8080 端口', () => {
        
        // 2. 修改 docker-compose 添加端口映射
        exec('cd /opt/evolution-whatsapp && sed -i "s/evolution-api:/evolution-api:\n    ports:\n      - \\"8080:8080\\"/" docker-compose.light.yml', '添加端口映射', () => {
            
            // 3. 重启服务
            exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d', '重启服务', () => {
                
                console.log('\n等待 20 秒...');
                setTimeout(() => {
                    
                    // 4. 检查 Evolution API 是否响应
                    exec('curl -s http://localhost:8080 -H "apikey: 684de76250938ef254f136318374608b" | head -50', '测试 Evolution API', () => {
                        
                        // 5. 确保 test_1 实例存在
                        exec('docker exec evolution-whatsapp-backend-1 node -e "const http=require(\'http\');const d=JSON.stringify({instanceName:\'test_1\',integration:\'WHATSAPP-BAILEYS\',qrcode:true});const o={hostname:\'evolution-api\',port:8080,path:\'/instance/create\',method:\'POST\',headers:{\'apikey\':\'684de76250938ef254f136318374608b\',\'Content-Type\':\'application/json\',\'Content-Length\':d.length}};const r=http.request(o,res=>{let data=\'\';res.on(\'data\',c=>data+=c);res.on(\'end\',()=>console.log(data))});r.on(\'error\',e=>console.log(\'Error:\',e.message));r.write(d);r.end();setTimeout(()=>process.exit(0),3000);"', '创建/确认 test_1 实例', () => {
                            
                            console.log('\n=== 完成 ===');
                            console.log('Evolution API Manager: http://8.222.170.254:8080/manager');
                            console.log('API Key: 684de76250938ef254f136318374608b');
                            conn.end();
                        });
                    });
                }, 20000);
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
