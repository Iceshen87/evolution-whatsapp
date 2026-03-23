const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查并修复 package.json ===\n');
    
    conn.exec("cat /opt/evolution-whatsapp/backend/package.json", (err, stream) => {
        let output = '';
        stream.on('data', d => output += d);
        stream.on('close', () => {
            console.log(output);
            
            if (!output.includes('"ws"')) {
                console.log('\n需要添加 ws 依赖...');
                
                // 直接替换整个 package.json
                const newPkg = `{
  "name": "evolution-whatsapp-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "@prisma/client": "^6.4.1",
    "axios": "^1.7.9",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^17.3.1",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^11.1.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/node": "^22.13.5",
    "@types/uuid": "^10.0.0",
    "@types/ws": "^8.5.14",
    "prisma": "^6.4.1",
    "tsx": "^4.19.3",
    "typescript": "^5.7.3"
  }
}`;
                
                // 写入文件
                conn.exec(`cat > /opt/evolution-whatsapp/backend/package.json << 'EOF'
${newPkg}
EOF`, (err, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => {
                        console.log('\npackage.json 已更新');
                        conn.end();
                    });
                });
            } else {
                console.log('\nws 依赖已存在');
                conn.end();
            }
        });
    });
});

conn.on('error', err => {
    console.error('SSH Error:', err.message);
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
