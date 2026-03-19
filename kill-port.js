const { execSync } = require('child_process');
const port = process.argv[2] || '3000';
try {
  const r = execSync('C:\\Windows\\System32\\netstat.exe -aon', { encoding: 'utf8' });
  const pids = new Set();
  r.split('\n').filter(l => l.includes(':' + port) && l.includes('LISTENING')).forEach(l => {
    const pid = l.trim().split(/\s+/).pop();
    pids.add(pid);
  });
  pids.forEach(pid => {
    console.log('Killing PID:', pid, 'on port', port);
    try { execSync('C:\\Windows\\System32\\taskkill.exe /PID ' + pid + ' /F', { encoding: 'utf8' }); } catch(e) {}
  });
  if (pids.size === 0) console.log('No process found on port', port);
  else console.log('Done');
} catch (e) {
  console.log('Error:', e.message);
}
