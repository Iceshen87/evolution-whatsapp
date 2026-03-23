const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Checking firewall...\n');
    
    // 检查 iptables
    conn.exec('iptables -L -n | grep 8080', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n检查 ufw:');
            conn.exec('ufw status 2>/dev/null || echo "ufw not installed"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n检查 firewalld:');
                    conn.exec('firewall-cmd --state 2>/dev/null || echo "firewalld not running"', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n检查阿里云安全组:');
                            conn.exec('curl -s http://100.100.100.200/latest/meta-data/security-groups 2>/dev/null || echo "Not Alibaba Cloud or no metadata"', (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n开放 8080 端口:');
                                    conn.exec('iptables -I INPUT -p tcp --dport 8080 -j ACCEPT 2>&1', (err, stream) => {
                                        stream.on('data', d => process.stdout.write(d.toString()));
                                        stream.on('close', () => {
                                            console.log('\n测试外部访问:');
                                            conn.exec('curl -s http://8.222.170.254:8080/manager/ 2>&1 | head -10', (err, stream) => {
                                                stream.on('data', d => process.stdout.write(d.toString()));
                                                stream.on('close', () => {
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
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
