const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    console.log('=== 检查 Evolution API WebSocket 端点 ===\n');
    
    // 测试不同的 WebSocket 端点
    const testCmd = `docker exec evolution-whatsapp-backend-1 node -e "
const WebSocket = require('ws');
const endpoints = ['/evolutionWS', '/ws', '/socket', '/chat', ''];

function testEndpoint(index) {
  if (index >= endpoints.length) {
    console.log('All tests completed');
    process.exit(0);
  }
  
  const endpoint = endpoints[index];
  console.log('Testing:', endpoint);
  
  try {
    const ws = new WebSocket('ws://evolution-api:8080' + endpoint, {
      headers: { apikey: '684de76250938ef254f136318374608b' }
    });
    
    const timeout = setTimeout(() => {
      ws.close();
      console.log('Timeout, trying next...');
      testEndpoint(index + 1);
    }, 3000);
    
    ws.on('open', () => {
      console.log('Connected to:', endpoint);
      clearTimeout(timeout);
      ws.close();
      testEndpoint(index + 1);
    });
    
    ws.on('error', (err) => {
      console.log('Error on', endpoint, ':', err.message);
      clearTimeout(timeout);
      testEndpoint(index + 1);
    });
  } catch(e) {
    console.log('Exception:', e.message);
    testEndpoint(index + 1);
  }
}

testEndpoint(0);
setTimeout(() => process.exit(0), 30000);
"`;
    
    conn.exec(testCmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
});

conn.on('error', err => {
    console.error('SSH Error:', err.message);
});

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
