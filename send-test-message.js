const { Client } = require('ssh2');

const SERVER = {
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358',
  tryKeyboard: true
};

function runSSH(commands) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let output = '';
    
    conn.on('ready', () => {
      conn.exec(commands, (err, stream) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }
        stream.on('close', () => {
          conn.end();
          resolve(output);
        }).on('data', (data) => {
          output += data.toString();
        }).stderr.on('data', (data) => {
          output += data.toString();
        });
      });
    }).on('keyboard-interactive', (_name, _instructions, _lang, prompts, finish) => {
      finish([SERVER.password]);
    }).on('error', reject);
    
    conn.connect(SERVER);
  });
}

async function main() {
  console.log('=== 修复后端 API Key 配置 ===');
  
  // 先找到项目目录
  console.log('步骤0: 查找项目目录...');
  const findDir = await runSSH('find /root -name "docker-compose.yml" -path "*evolution*" 2>/dev/null | head -1');
  const projectDir = findDir.trim().replace('/docker-compose.yml', '');
  console.log('项目目录:', projectDir);
  
  if (!projectDir) {
    console.log('未找到项目目录，尝试直接写入 docker-compose 环境...');
    // 直接查看 docker-compose 的配置
    const dcContent = await runSSH('docker inspect evolution-whatsapp-backend-1 --format "{{.Config.Env}}" 2>/dev/null');
    console.log('Backend 环境变量:', dcContent);
    return;
  }
  
  // 创建 .env 文件
  const envContent = `NODE_ENV=production
JWT_SECRET=evolution-whatsapp-jwt-secret-2024
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=684de76250938ef254f136318374608b
BACKEND_PORT=3000
DATABASE_URL=file:/app/data/app.db`;
  
  console.log('\n步骤1: 创建 .env 文件...');
  const createEnv = await runSSH(`cat > ${projectDir}/.env << 'ENVEOF'
${envContent}
ENVEOF`);
  console.log('创建结果:', createEnv || '成功');
  
  console.log('\n步骤2: 验证 .env 文件...');
  const verifyEnv = await runSSH(`cat ${projectDir}/.env`);
  console.log('文件内容:\n' + verifyEnv);
  
  console.log('\n步骤3: 重启 backend 服务...');
  const restart = await runSSH(`cd ${projectDir} && docker-compose restart backend`);
  console.log('重启结果:', restart);
  
  console.log('\n步骤4: 等待服务启动...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('\n步骤5: 测试 POS 接口...');
  const testPos = await runSSH('curl -s http://localhost/api/pos/status?appkey=test\&authkey=test');
  console.log('POS 接口响应:', testPos);
  
  console.log('\n=== 修复完成 ===');
}

main().catch(console.error);
