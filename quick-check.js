const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('Connected');
    
    conn.exec('docker ps 2>&1 | head -5', (err, stream) => {
        stream.on('data', (d) => console.log(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).on('error', (err) => {
    console.log('Error:', err.message);
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358',
    readyTimeout: 15000
});
