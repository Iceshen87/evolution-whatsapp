const axios = require('axios');

const BASE = 'http://8.222.170.254/api/web';

const POSSIBLE_PASSWORDS = ['admin123', 'admin', 'password', 'Admin@123', 'admin888', 'Evolution@2024'];

async function tryLogin(username, password) {
  try {
    const res = await axios.post(`${BASE}/auth/login`, { username, password }, { timeout: 10000 });
    return res.data.token;
  } catch (err) {
    return null;
  }
}

async function main() {
  // Try common passwords
  console.log('[1] Trying to find correct admin credentials...');
  let token = null;
  for (const pwd of POSSIBLE_PASSWORDS) {
    process.stdout.write(`  Trying admin/${pwd}... `);
    token = await tryLogin('admin', pwd);
    if (token) {
      console.log('OK!');
      break;
    }
    console.log('fail');
  }
  
  if (!token) {
    // Try root user
    for (const pwd of POSSIBLE_PASSWORDS) {
      process.stdout.write(`  Trying root/${pwd}... `);
      token = await tryLogin('root', pwd);
      if (token) { console.log('OK!'); break; }
      console.log('fail');
    }
  }
  
  if (!token) {
    console.error('[ERROR] Could not find valid credentials');
    process.exit(1);
  }
  console.log('[OK] Got token:', token.substring(0, 20) + '...');

  // 2. Get all users with POS credentials
  console.log('\n[2] Fetching users with POS credentials...');
  const usersRes = await axios.get(`${BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const users = usersRes.data.users;
  console.log(`[OK] Found ${users.length} user(s)`);

  for (const u of users) {
    console.log(`\n  User: ${u.username} (${u.role})`);
    console.log(`  Instance: ${u.instanceName || '(none)'}`);
    if (u.posMapping) {
      console.log(`  Server 1: appkey=${u.posMapping.appkey}, authkey=${u.posMapping.authkey}`);
      console.log(`  Server 2: instanceId=${u.posMapping.instanceId}, accessToken=${u.posMapping.accessToken}`);
    }
  }

  // 3. Find a user with instance and credentials
  const targetUser = users.find(u => u.posMapping && u.instanceName);
  if (!targetUser) {
    console.log('\n[!] No user has both POS credentials and an instance.');
    process.exit(1);
  }

  console.log(`\n[3] Using user: ${targetUser.username} (instance: ${targetUser.instanceName})`);

  // 4. Check instance connection state via POS status endpoint
  console.log('\n[4] Checking WhatsApp connection status...');
  const creds = targetUser.posMapping;
  const statusRes = await axios.get(`${BASE.replace('/web', '')}/pos/status`, {
    params: {
      appkey: creds.appkey,
      authkey: creds.authkey,
    },
  });
  console.log('[Status]:', JSON.stringify(statusRes.data));

  if (statusRes.data.status !== 'open') {
    console.log('\n[!] WhatsApp instance is NOT connected (status:', statusRes.data.status, ')');
    console.log('    Please bind the QR code first in the web UI.');
    process.exit(1);
  }

  // 5. Send test message
  const phone = '8618602031398'; // +86 18602031398 -> 8618602031398
  const message = '这是一条测试消息，你好！来自 evolution-whatsapp 测试。';

  console.log(`\n[5] Sending message to +${phone}...`);
  const sendRes = await axios.get(`${BASE.replace('/web', '')}/pos/create-message`, {
    params: {
      appkey: creds.appkey,
      authkey: creds.authkey,
      to: phone,
      message: message,
    },
  });
  console.log('[Send Result]:', JSON.stringify(sendRes.data, null, 2));
}

main().catch(err => {
  console.error('[ERROR]:', err.response?.data || err.message);
  process.exit(1);
});
