const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SERVER = '8.222.170.254';
const USER = 'root';

const commands = [
    'cd /root/evolution-whatsapp',
    'echo "[1/4] Pulling latest code from GitHub..."',
    'git pull origin main',
    'echo "[2/4] Stopping containers..."',
    'docker-compose down',
    'echo "[3/4] Building frontend and backend..."',
    'docker-compose build --no-cache frontend backend',
    'echo "[4/4] Starting services..."',
    'docker-compose up -d',
    'echo "========================================"',
    'echo " Deployment Complete!"',
    'echo "========================================"',
    'docker-compose ps'
];

async function deploy() {
    console.log('========================================');
    console.log(' Deploying to Server:', SERVER);
    console.log('========================================\n');

    const sshCommand = `ssh ${USER}@${SERVER} "${commands.join(' && ')}"`;
    
    console.log('Executing:', sshCommand, '\n');
    
    try {
        const { stdout, stderr } = await execAsync(sshCommand);
        console.log(stdout);
        if (stderr) console.error(stderr);
    } catch (error) {
        console.error('Deployment failed:', error.message);
    }
}

deploy();
