const { Client } = require('ssh2');

const conn = new Client();
let step = 0;

function execCommand(cmd, callback) {
    console.log(`\n[Step ${++step}] ${cmd.substring(0, 60)}...`);
    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error('Error:', err);
            conn.end();
            return;
        }
        let output = '';
        stream.on('data', (data) => {
            output += data.toString();
            process.stdout.write(data.toString());
        });
        stream.stderr.on('data', (data) => {
            process.stdout.write(data.toString());
        });
        stream.on('close', () => {
            console.log(`[Step ${step}] Done`);
            if (callback) callback(output);
        });
    });
}

conn.on('ready', () => {
    console.log('=== SSH Connected ===');
    
    // Step 1: Stop all services
    execCommand('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml down -v', () => {
        
        // Step 2: Start services
        setTimeout(() => {
            execCommand('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d', () => {
                
                // Step 3: Wait and check
                console.log('\nWaiting 40 seconds for initialization...');
                setTimeout(() => {
                    execCommand('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml ps', () => {
                        
                        // Step 4: Check Evolution API logs
                        execCommand('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml logs --tail=20 evolution-api', () => {
                            console.log('\n=== Fix Complete ===');
                            conn.end();
                        });
                    });
                }, 40000);
            });
        }, 3000);
    });
});

conn.on('error', (err) => {
    console.error('SSH Error:', err.message);
    process.exit(1);
});

console.log('Connecting to 8.222.170.254...');
conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
