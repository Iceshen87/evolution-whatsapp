const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 删除 nginx.conf 目录并创建文件
  conn.exec('rm -rf /opt/evolution-whatsapp/nginx/nginx.conf && mkdir -p /opt/evolution-whatsapp/nginx', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.on('close', () => {
      // 创建正确的 nginx.conf
      const nginxConf = `worker_processes 1;
events {
    worker_connections 1024;
}
http {
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        location /api/ {
            proxy_pass http://evolution-whatsapp-backend-1:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}`;
      
      const cmd = `echo "${Buffer.from(nginxConf).toString('base64')}" | base64 -d > /opt/evolution-whatsapp/nginx/nginx.conf && docker compose -f /opt/evolution-whatsapp/docker-compose.yml up -d nginx`;
      
      conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stdout.write(d));
        stream.on('close', () => {
          console.log('\nNginx recreated');
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
