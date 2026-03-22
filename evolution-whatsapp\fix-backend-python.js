const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('使用 Python 修改配置...');
    
    const pythonScript = `
import re

with open('/opt/evolution-whatsapp/docker-compose.yml', 'r') as f:
    content = f.read()

# 在 build: ./backend 后添加 command
content = content.replace(
    'build: ./backend',
    'command: ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]\\n    build: ./backend'
)

with open('/opt/evolution-whatsapp/docker-compose.yml', 'w') as f:
    f.write(content)

print('Done')
`;
    
    const escapedScript = pythonScript.replace(/"/g, '\\\\"').replace(/\\n/g, '\\\\n');
    
    conn.exec(`python3 -c "${escapedScript}"`, (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n验证:');
            conn.exec("grep -A3 'command:' /opt/evolution-whatsapp/docker-compose.yml", (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n重启 backend...');
                    conn.exec('cd /opt/evolution-whatsapp && docker compose up -d backend', (err, stream) => {
                        stream.on('data', (d) => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            setTimeout(() => {
                                conn.exec('docker logs --tail=15 evolution-whatsapp-backend-1 2>&1', (err, stream) => {
                                    stream.on('data', (d) => process.stdout.write(d.toString()));
                                    stream.on('close', () => conn.end());
                                });
                            }, 15000);
                        });
                    });
                });
            });
        });
    });
});

conn.on('error', (err) => console.error(err.message));
conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
