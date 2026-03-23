const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  // 第一步：修复目录结构
  const fixScript = `
    cd /opt/evolution-whatsapp
    
    # 备份重要数据
    mkdir -p /tmp/backup
    cp -r backend /tmp/backup/ 2>/dev/null || true
    cp backend/.env /tmp/backup/ 2>/dev/null || true
    
    # 创建正确的目录结构
    mkdir -p frontend/src/pages
    mkdir -p frontend/src/components
    mkdir -p frontend/public
    mkdir -p frontend/dist/assets
    
    echo "Directories created"
  `;
  
  conn.exec(fixScript, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('data', (data) => process.stdout.write(data));
    stream.stderr.on('data', (data) => process.stdout.write(data));
    stream.on('close', () => {
      console.log('\nStep 1 done. Now copying files...');
      
      // 第二步：复制文件到正确位置
      const copyScript = `
        cd /opt/evolution-whatsapp
        
        # 复制 frontend 文件（从混乱的文件名中提取）
        for f in evolution-whatsapp\\\\frontend\\\\dist\\\\assets\\\\index-*; do
          if [ -f "$f" ]; then
            cp "$f" frontend/dist/assets/ 2>/dev/null
          fi
        done
        
        for f in evolution-whatsapp\\\\frontend\\\\dist\\\\*; do
          if [ -f "$f" ]; then
            cp "$f" frontend/dist/ 2>/dev/null
          fi
        done
        
        for f in evolution-whatsapp\\\\frontend\\\\src\\\\pages\\\\*.tsx; do
          if [ -f "$f" ]; then
            cp "$f" frontend/src/pages/ 2>/dev/null
          fi
        done
        
        for f in evolution-whatsapp\\\\frontend\\\\src\\\\components\\\\*.tsx; do
          if [ -f "$f" ]; then
            cp "$f" frontend/src/components/ 2>/dev/null
          fi
        done
        
        for f in evolution-whatsapp\\\\frontend\\\\src\\\\*.tsx; do
          if [ -f "$f" ]; then
            cp "$f" frontend/src/ 2>/dev/null
          fi
        done
        
        for f in evolution-whatsapp\\\\frontend\\\\public\\\\*; do
          if [ -f "$f" ]; then
            cp "$f" frontend/public/ 2>/dev/null
          fi
        done
        
        cp "evolution-whatsapp\\\\frontend\\\\package.json" frontend/ 2>/dev/null
        cp "evolution-whatsapp\\\\frontend\\\\tsconfig.json" frontend/ 2>/dev/null
        cp "evolution-whatsapp\\\\frontend\\\\tsconfig.app.json" frontend/ 2>/dev/null
        cp "evolution-whatsapp\\\\frontend\\\\tsconfig.node.json" frontend/ 2>/dev/null
        cp "evolution-whatsapp\\\\frontend\\\\vite.config.ts" frontend/ 2>/dev/null
        cp "evolution-whatsapp\\\\frontend\\\\postcss.config.js" frontend/ 2>/dev/null
        cp "evolution-whatsapp\\\\frontend\\\\eslint.config.js" frontend/ 2>/dev/null
        cp "evolution-whatsapp\\\\frontend\\\\index.html" frontend/ 2>/dev/null
        
        echo "Files copied"
        ls -la frontend/src/pages/
      `;
      
      conn.exec(copyScript, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('data', (data) => process.stdout.write(data));
        stream.stderr.on('data', (data) => process.stdout.write(data));
        stream.on('close', () => {
          console.log('\nStep 2 done. Now building...');
          
          // 第三步：构建前端
          const buildScript = `
            cd /opt/evolution-whatsapp/frontend
            npm install
            npm run build
            cp -r dist/* /usr/share/nginx/html/
            docker restart evolution-whatsapp-nginx-1
          `;
          
          conn.exec(buildScript, (err, stream) => {
            if (err) { console.error(err); conn.end(); return; }
            stream.on('data', (data) => process.stdout.write(data));
            stream.stderr.on('data', (data) => process.stdout.write(data));
            stream.on('close', (code) => {
              console.log('\nDone! Exit code:', code);
              conn.end();
            });
          });
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
