const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Restarting Evolution API...');
    
    conn.exec('docker restart evolution-whatsapp-evolution-api-1', (err, stream) => {
        stream.on('data', (data) => process.stdout.write(data.toString()));
        stream.on('close', () => {
            console.log('Waiting 25 seconds...');
            setTimeout(() => {
                conn.exec('docker logs --tail=30 evolution-whatsapp-evolution-api-1', (err, stream) => {
                    stream.on('data', (data) => process.stdout.write(data.toString()));
                    stream.on('close', () => {
                        conn.end();
                    });
                });
            }, 25000);
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
