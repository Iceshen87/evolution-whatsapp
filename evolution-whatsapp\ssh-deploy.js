const { Client } = require('ssh2');

const CONFIG = {
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
};

let conn = null;

function connect() {
    return new Promise((resolve, reject) => {
        conn = new Client();
        conn.on('ready', () => {
            console.log('  ✅ SSH 连接成功');
            resolve(conn);
        });
        conn.on('error', (err) => {
            console.error('  SSH 错误:', err.message);
            reject(err);
        });
        conn.on('keyboard-interactive', (name, instr, lang, prompts, cb) => {
            console.log('  收到键盘交互认证请求');
            cb([CONFIG.password]);
        });
        conn.on('banner', (msg) => {
            console.log('  服务器消息:', msg);
        });
        conn.connect({
            host: CONFIG.host,
            port: CONFIG.port,
            username: CONFIG.username,
            password: CONFIG.password,
            readyTimeout: 30000,
            algorithms: {
                kex: [
                    'ecdh-sha2-nistp256',
                    'ecdh-sha2-nistp384',
                    'ecdh-sha2-nistp521',
                    'diffie-hellman-group-exchange-sha256',
                    'diffie-hellman-group14-sha256',
                    'diffie-hellman-group-exchange-sha1',
                    'diffie-hellman-group14-sha1',
                    'diffie-hellman-group1-sha1'
                ],
                cipher: [
                    'aes128-ctr',
                    'aes192-ctr',
                    'aes256-ctr',
                    'aes128-cbc',
                    'aes192-cbc',
                    'aes256-cbc',
                    '3des-cbc'
                ],
                serverHostKey: [
                    'ssh-rsa',
                    'ssh-dss',
                    'ecdsa-sha2-nistp256',
                    'ecdsa-sha2-nistp384',
                    'ecdsa-sha2-nistp521'
                ],
                hmac: [
                    'hmac-sha2-256',
                    'hmac-sha2-512',
                    'hmac-sha1',
                    'hmac-sha1-etm@openssh.com',
                    'hmac-sha2-256-etm@openssh.com',
                    'hmac-sha2-512-etm@openssh.com'
                ]
            }
        });
    });
}

function ssh(command) {
    return new Promise((resolve, reject) => {
        if (!conn) return reject(new Error('Not connected'));
        conn.exec(command, (err, stream) => {
            if (err) return reject(err);
            let stdout = '';
            let stderr = '';
            stream.on('data', (data) => {
                const str = data.toString();
                stdout += str;
                process.stdout.write(str);
            });
            stream.stderr.on('data', (data) => {
                stderr += data.toString();
                process.stderr.write(data);
            });
            stream.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(stderr || `Exit code: ${code}`));
                }
            });
        });
    });
}

async function scp(localFile, remotePath) {
    return new Promise((resolve, reject) => {
        const args = [
            '-p', CONFIG.password,
            'scp',
            '-o', 'StrictHostKeyChecking=no',
            localFile,
            `${CONFIG.username}@${CONFIG.host}:${remotePath}`
        ];
        
        const proc = spawn('sshpass', args);
        
        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`SCP failed with code ${code}`));
            }
        });
        
        proc.on('error', reject);
    });
}

async function deploy() {
    console.log('========================================');
    console.log('  Evolution WhatsApp 自动化部署');
    console.log('  服务器: ' + CONFIG.host);
    console.log('========================================\n');

    try {
        // 连接服务器
        console.log('[0/6] 连接服务器...');
        await connect();

        // 1. 检查系统
        console.log('\n[1/6] 检查服务器系统...');
        await ssh('free -h && df -h / && uname -a');
        console.log('  ✅ 系统检查完成');

        // 2. 配置 Swap
        console.log('\n[2/6] 配置 Swap 空间...');
        await ssh('if [ ! -f /swapfile ]; then fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo "/swapfile none swap sw 0 0" >> /etc/fstab && echo "Swap 2GB 已创建"; else echo "Swap 已存在"; fi && swapon --show');
        console.log('  ✅ Swap 配置完成');

        // 3. 安装 Docker
        console.log('[3/6] 安装 Docker...');
        try {
            await ssh('docker --version');
            console.log('  Docker 已安装');
        } catch (e) {
            await ssh('curl -fsSL https://get.docker.com | sh && systemctl enable docker && systemctl start docker');
            console.log('  ✅ Docker 安装完成');
        }

        // 4. 安装 Docker Compose
        console.log('[4/6] 安装 Docker Compose...');
        try {
            await ssh('docker compose version');
            console.log('  Docker Compose 已安装');
        } catch (e) {
            await ssh('apt-get update && apt-get install -y docker-compose-plugin');
            console.log('  ✅ Docker Compose 安装完成');
        }

        // 5. 下载项目
        console.log('[5/6] 下载项目代码...');
        await ssh('if [ ! -d /opt/evolution-whatsapp ]; then git clone https://github.com/Iceshen87/evolution-whatsapp.git /opt/evolution-whatsapp && echo "项目已克隆"; else cd /opt/evolution-whatsapp && git pull && echo "项目已更新"; fi');
        console.log('  ✅ 项目下载完成');

        // 6. 配置并启动
        console.log('[6/6] 配置并启动服务...');
        
        // 生成随机密码
        const jwtSecret = require('crypto').randomBytes(32).toString('hex');
        const evolutionKey = require('crypto').randomBytes(16).toString('hex');
        const postgresPass = require('crypto').randomBytes(16).toString('hex');
        const adminPass = 'Admin@' + new Date().toISOString().slice(0,10).replace(/-/g,'');

        // 创建 .env 文件
        const envContent = `# Evolution WhatsApp Management System
NODE_ENV=production
DOMAIN=${CONFIG.host}
JWT_SECRET=${jwtSecret}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${adminPass}
BACKEND_PORT=3000
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=${evolutionKey}
EVOLUTION_SERVER_URL=http://${CONFIG.host}:8080
POSTGRES_DB=evolution
POSTGRES_USER=evolution
POSTGRES_PASSWORD=${postgresPass}
REDIS_URL=redis://redis:6379
`;
        await ssh(`mkdir -p /opt/evolution-whatsapp && cat > /opt/evolution-whatsapp/.env << 'ENVEOF'
${envContent}ENVEOF`);
        console.log('  ✅ 环境变量已配置');
        
        console.log('  启动数据库...');
        await ssh('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d postgres redis');
        await new Promise(r => setTimeout(r, 10000));
        
        console.log('  启动 Evolution API...');
        await ssh('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d evolution-api');
        await new Promise(r => setTimeout(r, 15000));
        
        console.log('  启动全部服务...');
        await ssh('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d backend frontend nginx');
        
        console.log('  ✅ 服务启动完成');

        // 检查状态
        console.log('\n检查服务状态...');
        await ssh('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml ps');

        console.log('');
        console.log('========================================');
        console.log('  部署完成！');
        console.log('========================================');
        console.log('');
        console.log('  访问地址:');
        console.log('    管理后台: http://' + CONFIG.host);
        console.log('    Evolution API: http://' + CONFIG.host + ':8080');
        console.log('');
        console.log('  管理员账号: admin');
        console.log('  管理员密码: ' + adminPass);
        console.log('  Evolution API Key: ' + evolutionKey);
        console.log('');
        console.log('  查看日志: docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml logs -f');
        console.log('  查看状态: docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml ps');
        console.log('  监控资源: docker stats');
        console.log('');
        console.log('========================================');

    } catch (error) {
        console.error('\n❌ 部署失败:', error.message);
        process.exit(1);
    } finally {
        if (conn) conn.end();
    }
}

deploy();
