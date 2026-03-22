const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Checking config...\n');
    
    conn.exec('cat /opt/evolution-whatsapp/docker-compose.light.yml | grep -A5 "evolution-api:"', (err, stream) => {
        stream.on('data', d => console.log(d.toString()));
        stream.on('close', () => {
            console.log('\nIf ports not shown, need to fix');
            conn.end();
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
