const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查 Evolution API 日志 ===\n');
    
    conn.exec('docker logs evolution-whatsapp-evolution-api-1 2>&1 | tail -50', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查 WhatsApp Baileys 连接日志:');
            conn.exec('docker logs evolution-whatsapp-evolution-api-1 2>&1 | grep -iE "(baileys|whatsapp|pairing|code)" | tail -20', (err, stream) => {
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
