const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();

conn.on('ready', () => {
    console.log('上传修改后的 docker-compose.yml...');
    
    // 上传 docker-compose.yml
    const config = fs.readFileSync('d:/Code/evolution-whatsapp/docker-compose.yml', 'utf8');
    
    // 使用 heredoc 上传文件
    const escapedContent = config.replace(/'/g, "'\\''");
    
    conn.exec(`cat > /opt/evolution-whatsapp/docker-compose.yml << 'EOFCONFIG'\n${config}\nEOFCONFIG`, (err, stream) => {
        stream.on('close', () => {
            console.log('文件已上传');
            
            console.log('重启所有服务...');
            conn.exec('cd /opt/evolution-whatsapp && docker compose down && docker compose up -d', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n等待 30 秒...');
                    setTimeout(() => {
                        conn.exec('docker ps --format "table {{.Names}}\\t{{.Status}}"', (err, stream) => {
                            stream.on('data', (d) => process.stdout.write(d.toString()));
                            stream.on('close', () => {
                                console.log('\n测试 API:');
                                conn.exec('curl -s http://localhost:8080', (err, stream) => {
                                    stream.on('data', (d) => process.stdout.write(d.toString()));
                                    stream.on('close', () => conn.end());
                                });
                            });
                        });
                    }, 30000);
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
