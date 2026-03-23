const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 创建 nginx 配置
  const nginxConf = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}`;
  
  // 上传配置
  const cmd = 'echo "' + Buffer.from(nginxConf).toString('base64') + '" | base64 -d > /tmp/nginx.conf && docker rm -f evolution-whatsapp-nginx-1 2>/dev/null; docker run -d --name evolution-whatsapp-nginx-1 -p 80:80 -v /tmp/nginx.conf:/etc/nginx/conf.d/default.conf nginx:alpine';
  
  conn.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stdout.write(d));
    stream.on('close', () => {
      console.log('Nginx restarted');
      conn.end();
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
