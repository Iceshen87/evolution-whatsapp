const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected');
  
  const cmds = [
    'cd /opt/evolution-whatsapp',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\App.tsx" frontend/src/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\main.tsx" frontend/src/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\index.css" frontend/src/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\pages\\\\BindInstance.tsx" frontend/src/pages/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\pages\\\\CreateUser.tsx" frontend/src/pages/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\pages\\\\Dashboard.tsx" frontend/src/pages/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\pages\\\\Instances.tsx" frontend/src/pages/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\pages\\\\Login.tsx" frontend/src/pages/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\pages\\\\Users.tsx" frontend/src/pages/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\components\\\\Layout.tsx" frontend/src/components/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\components\\\\ProtectedRoute.tsx" frontend/src/components/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\services\\\\api.ts" frontend/src/services/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\store\\\\authStore.ts" frontend/src/store/',
    'cp "evolution-whatsapp\\\\frontend\\\\src\\\\types\\\\index.ts" frontend/src/types/',
    'cp "evolution-whatsapp\\\\frontend\\\\public\\\\favicon.svg" frontend/public/',
    'cp "evolution-whatsapp\\\\frontend\\\\public\\\\icons.svg" frontend/public/',
    'cp "evolution-whatsapp\\\\frontend\\\\package.json" frontend/',
    'cp "evolution-whatsapp\\\\frontend\\\\package-lock.json" frontend/',
    'cp "evolution-whatsapp\\\\frontend\\\\tsconfig.json" frontend/',
    'cp "evolution-whatsapp\\\\frontend\\\\tsconfig.app.json" frontend/',
    'cp "evolution-whatsapp\\\\frontend\\\\tsconfig.node.json" frontend/',
    'cp "evolution-whatsapp\\\\frontend\\\\vite.config.ts" frontend/',
    'cp "evolution-whatsapp\\\\frontend\\\\postcss.config.js" frontend/',
    'cp "evolution-whatsapp\\\\frontend\\\\index.html" frontend/',
    'ls -la frontend/src/pages/'
  ].join(' && ');
  
  conn.exec(cmds, (err, stream) => {
    stream.on('data', (data) => process.stdout.write(data));
    stream.stderr.on('data', (data) => process.stdout.write(data));
    stream.on('close', () => {
      console.log('\nStep 2: Files copied');
      conn.end();
    });
  });
}).connect({
  host: '8.222.170.254',
  port: 22,
  username: 'root',
  password: 'Teck0358'
});
