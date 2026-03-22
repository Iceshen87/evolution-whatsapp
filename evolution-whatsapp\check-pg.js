const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 检查 PostgreSQL 状态 ===\n');
    
    conn.exec('docker exec evolution-whatsapp-postgres-1 psql -U postgres -c "\\du"', (err, stream) => {
        let output = '';
        stream.on('data', (data) => output += data.toString());
        stream.on('close', () => {
            console.log('Users:', output);
            
            conn.exec('docker exec evolution-whatsapp-postgres-1 psql -U postgres -l', (err, stream) => {
                let output2 = '';
                stream.on('data', (data) => output2 += data.toString());
                stream.on('close', () => {
                    console.log('Databases:', output2);
                    
                    console.log('\n=== 测试连接 ===');
                    conn.exec("docker exec evolution-whatsapp-postgres-1 psql -U evolution -d evolution -c 'SELECT 1;'", (err, stream) => {
                        let output3 = '';
                        stream.on('data', (data) => output3 += data.toString());
                        stream.on('close', () => {
                            console.log('Test connection result:', output3);
                            conn.end();
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', (err) => {
    console.error('SSH Error:', err.message);
    process.exit(1);
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
