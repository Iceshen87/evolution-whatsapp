const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Checking Evolution API...\n');
    
    conn.exec('docker ps | grep evolution', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\nLogs:');
            conn.exec('docker logs --tail=20 evolution-whatsapp-evolution-api-1', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\nRestarting...');
                    conn.exec('docker restart evolution-whatsapp-evolution-api-1', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\nWaiting 20s...');
                            setTimeout(() => {
                                console.log('\nDone. Try http://8.222.170.254:8080/manager');
                                conn.end();
                            }, 20000);
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
