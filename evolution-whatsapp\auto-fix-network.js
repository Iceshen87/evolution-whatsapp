const { Client } = require('ssh2');

const conn = new Client();
let step = 0;

function execCommand(cmd, callback, delay = 0) {
    console.log(`\n[Step ${++step}] ${cmd.substring(0, 70)}...`);
    
    setTimeout(() => {
        conn.exec(cmd, (err, stream) => {
            if (err) {
                console.error('Error:', err);
                if (callback) callback('');
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
    }, delay);
}

conn.on('ready', () => {
    console.log('=== SSH Connected - 自动修复网络问题 ===');
    
    // Step 1: 检查网络
    execCommand('docker network ls', () => {
        
        // Step 2: 检查容器是否在同一网络
        execCommand('docker inspect evolution-whatsapp-evolution-api-1 --format="{{.NetworkSettings.Networks}}"', (output) => {
            
            // Step 3: 重启所有服务确保网络正确
            execCommand('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml restart', () => {
                
                // Step 4: 等待服务启动
                console.log('\nWaiting 40 seconds for services to start...');
                
                setTimeout(() => {
                    // Step 5: 检查 PostgreSQL 连接
                    execCommand('docker exec evolution-whatsapp-evolution-api-1 sh -c "nc -z postgres 5432 && echo PostgreSQL reachable || echo PostgreSQL NOT reachable"', (output) => {
                        
                        if (output.includes('NOT reachable')) {
                            console.log('\n⚠️ PostgreSQL 仍不可达，尝试重建网络...');
                            
                            // Step 6: 重建网络
                            execCommand('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml down && docker network prune -f', () => {
                                
                                setTimeout(() => {
                                    execCommand('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d', () => {
                                        
                                        setTimeout(() => {
                                            // Step 7: 最终检查
                                            execCommand('docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml ps', (output) => {
                                                console.log('\n=== 修复完成 ===');
                                                conn.end();
                                            });
                                        }, 30000);
                                    });
                                }, 5000);
                            });
                        } else {
                            // PostgreSQL 可达，检查 Evolution API 日志
                            execCommand('docker logs --tail=30 evolution-whatsapp-evolution-api-1', () => {
                                console.log('\n=== 修复完成 ===');
                                conn.end();
                            });
                        }
                    });
                }, 40000);
            });
        });
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
