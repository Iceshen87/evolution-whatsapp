const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查 Evolution API 503 错误 ===\n');
    
    // 检查容器状态
    conn.exec('docker ps -a | grep evolution', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查 Evolution API 日志:');
            conn.exec('docker logs --tail=30 evolution-whatsapp-evolution-api-1', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n测试 API:');
                    conn.exec('docker exec evolution-whatsapp-backend-1 node -e "const http=require(\\'http\\');http.get(\\'http://evolution-api:8080\\',res=>{let d=\\'\\';res.on(\\'data\\',c=>d+=c);res.on(\\'end\\',()=>console.log(\\'Status:\\',res.statusCode,d.substring(0,100)));}).on(\\'error\\',e=>console.log(\\'Error:\\',e.message));setTimeout(()=>process.exit(0),5000);"', (err, stream) => {
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

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
