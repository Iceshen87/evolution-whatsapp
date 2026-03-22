const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== Evolution API 错误日志 ===\n');
    
    conn.exec('docker logs evolution-whatsapp-evolution-api-1 2>&1 | tail -200', (err, stream) => {
        let output = '';
        stream.on('data', (d) => output += d.toString());
        stream.on('close', () => {
            // 查找错误信息
            const lines = output.split('\n');
            const errorLines = lines.filter(line => 
                line.toLowerCase().includes('error') || 
                line.toLowerCase().includes('fail') ||
                line.toLowerCase().includes('exception')
            );
            
            console.log('Error lines:');
            errorLines.slice(-20).forEach(line => console.log(line));
            
            if (errorLines.length === 0) {
                console.log('No errors found in recent logs');
                console.log('\nLast 30 lines:');
                lines.slice(-30).forEach(line => console.log(line));
            }
            
            conn.end();
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
