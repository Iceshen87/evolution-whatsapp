const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Fixing firewall for port 8080...\n');
    
    // 添加允许外部访问 8080 的规则
    conn.exec('iptables -I INPUT -p tcp --dport 8080 -j ACCEPT', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('Added INPUT rule\n');
            
            // 添加 FORWARD 规则
            conn.exec('iptables -I FORWARD -p tcp --dport 8080 -j ACCEPT', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('Added FORWARD rule\n');
                    
                    // 检查规则
                    conn.exec('iptables -L -n | grep 8080', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\nTesting external access from server:');
                            conn.exec('curl -s http://8.222.170.254:8080/manager/ 2>&1 | head -10', (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n=== Done ===');
                                    console.log('Try: http://8.222.170.254:8080/manager/');
                                    conn.end();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
