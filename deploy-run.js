const { spawn } = require('child_process');

const SERVER = '8.222.170.254';
const USER = 'root';
const PASSWORD = 'Teck0358';
const COMMANDS = 'cd /root/evolution-whatsapp && docker compose down && (docker rmi evolution-whatsapp-frontend 2>/dev/null || true) && docker compose build --no-cache frontend backend && docker compose up -d && docker compose ps';

console.log('========================================');
console.log(' Auto Deploying to:', SERVER);
console.log('========================================\n');

const child = spawn('sshpass', [
    '-p', PASSWORD,
    'ssh',
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'UserKnownHostsFile=/dev/null',
    `${USER}@${SERVER}`,
    COMMANDS
]);

child.stdout.on('data', (data) => process.stdout.write(data));
child.stderr.on('data', (data) => process.stderr.write(data));

child.on('close', (code) => {
    console.log('\n========================================');
    console.log(' Finished with code:', code);
    console.log('========================================');
    process.exit(code);
});

child.on('error', (err) => {
    console.error('Error:', err.message);
});
