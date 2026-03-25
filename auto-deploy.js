const { spawn } = require('child_process');
const readline = require('readline');

const SERVER = '8.222.170.254';
const USER = 'root';
const PASSWORD = 'Teck0358';
const COMMANDS = [
    'cd /root/evolution-whatsapp',
    'docker compose down',
    'docker rmi evolution-whatsapp-frontend 2>/dev/null || true',
    'docker compose build --no-cache frontend backend',
    'docker compose up -d',
    'docker compose ps'
];

async function sendInput(stdin, data) {
    return new Promise((resolve) => {
        stdin.write(data + '\n');
        setTimeout(resolve, 500);
    });
}

async function run() {
    console.log('========================================');
    console.log(' Auto Deploying to:', SERVER);
    console.log('========================================\n');

    const child = spawn('sshpass', [
        '-p', PASSWORD,
        'ssh',
        '-o', 'StrictHostKeyChecking=no',
        `${USER}@${SERVER}`,
        COMMANDS.join(' && ')
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    child.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    child.stderr.on('data', (data) => {
        console.log(data.toString());
    });

    child.on('close', (code) => {
        console.log('\n========================================');
        console.log(' Deployment finished with code:', code);
        console.log('========================================');
    });

    child.on('error', (err) => {
        console.error('SSH Error:', err.message);
    });
}

run();
