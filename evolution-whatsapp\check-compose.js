const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Checking full config...\n');
    
    conn.exec('wc -l /opt/evolution-whatsapp/docker-compose.light.yml && head -30 /opt/evolution-whatsapp/docker-compose.light.yml', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d.toString());
        stream.on('close', () => {
            console.log(output);
            if (output.includes('evolution-api') && !output.includes('ports')) {
                console.log('\nports missing! Need to add it.');
            }
            conn.end();
        });
    });
});

conn.on('error', err => console.error(err.message));
conn.connect({ host: '8.222.170.254', port: 22, username: 'root', password: 'Teck0358' });
