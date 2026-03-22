const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Checking ports...\n');
    
    conn.exec('netstat -tlnp | grep -E "80|8080"', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\nChecking containers...');
            conn.exec('docker ps --format "table {{.Names}}\t{{.Ports}}"', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n=== Complete ===');
                    console.log('Manager: http://8.222.170.254:8080/manager');
                    console.log('API Key: 684de76250938ef254f136318374608b');
                    console.log('Frontend: http://8.222.170.254');
                    conn.end();
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
