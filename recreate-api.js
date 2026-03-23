const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('停止并删除旧容器...');
    conn.exec('docker stop evolution-whatsapp-evolution-api-1 && docker rm evolution-whatsapp-evolution-api-1', (err, stream) => {
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n拉取 v1.8.7...');
            conn.exec('docker pull atendai/evolution-api:v1.8.7', (err, stream) => {
                stream.on('data', (d) => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n启动新容器...');
                    conn.exec('cd /opt/evolution-whatsapp && docker compose up -d evolution-api', (err, stream) => {
                        stream.on('data', (d) => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n等待 30 秒...');
                            setTimeout(() => {
                                conn.exec('docker ps | grep evolution; curl -s http://localhost:8080', (err, stream) => {
                                    stream.on('data', (d) => process.stdout.write(d.toString()));
                                    stream.on('close', () => conn.end());
                                });
                            }, 30000);
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
