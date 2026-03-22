const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查 Baileys 连接日志 ===\n');
    
    // 获取 Evolution API 完整日志
    conn.exec('docker logs evolution-whatsapp-evolution-api-1 2>&1 | grep -iE "(baileys|whatsapp|connecting|connection|error|warn)" | tail -30', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查实例 123 的特定日志:');
            conn.exec('docker logs evolution-whatsapp-evolution-api-1 2>&1 | grep -E "(123|25b4a478)" | tail -20', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    conn.end();
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
