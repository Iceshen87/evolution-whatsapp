const { Client } = require('ssh2');

const conn = new Client();

const config = {
  host: '47.236.151.160',
  port: 22,
  username: 'root',
  password: 'Teck0358',
  readyTimeout: 30000
};

const newConfig = `server {
    server_name cochub.xyz www.cochub.xyz;

    root /opt/COC-Hub/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Site API proxy
    location /site/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1024;

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/cochub.xyz/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/cochub.xyz/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.cochub.xyz) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = cochub.xyz) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name cochub.xyz www.cochub.xyz;
    return 404; # managed by Certbot
}
`;

conn.on('ready', () => {
  console.log('Connected!');
  
  // Write new config
  conn.exec(`cat > /etc/nginx/conf.d/cochub.xyz.conf << 'EOFCONFIG'\n${newConfig}\nEOFCONFIG`, (err, stream) => {
    stream.on('data', (data) => {
      console.log(data.toString());
    }).on('close', () => {
      // Test nginx config
      conn.exec('nginx -t && nginx -s reload', (err, stream) => {
        stream.on('data', (data) => {
          console.log(data.toString());
        }).on('close', () => {
          console.log('\n========================================');
          console.log('Nginx config updated!');
          console.log('Test: https://cochub.xyz');
          console.log('========================================');
          conn.end();
        });
      });
    });
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});

conn.connect(config);
