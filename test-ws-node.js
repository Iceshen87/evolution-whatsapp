const WebSocket = require('ws');

const endpoints = [
  'ws://8.222.170.254:8080/websocket',
  'ws://8.222.170.254:8080/ws',
  'ws://8.222.170.254:8080/evolutionWS',
  'ws://8.222.170.254:8080/',
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    console.log(`\n测试: ${url}`);
    
    const ws = new WebSocket(url, {
      headers: {
        'apikey': '684de76250938ef254f136318374608b',
      },
      timeout: 5000,
    });

    ws.on('open', () => {
      console.log('  ✅ 连接成功');
      ws.send(JSON.stringify({ action: 'subscribe', instance: '123' }));
    });

    ws.on('message', (data) => {
      console.log('  📨 收到消息:', data.toString().substring(0, 100));
    });

    ws.on('error', (err) => {
      console.log('  ❌ 错误:', err.message);
      resolve();
    });

    ws.on('close', () => {
      console.log('  🔒 连接关闭');
      resolve();
    });

    setTimeout(() => {
      ws.close();
      resolve();
    }, 3000);
  });
}

async function main() {
  console.log('=== 测试 WebSocket 端点 ===');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n=== 测试完成 ===');
}

main();
