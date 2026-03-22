const { Client } = require('ssh2');

const conn = new Client();

const evolutionService = `import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { config } from '../config';

interface QRCodeData {
  qrcode?: string;
  base64?: string;
  code?: string;
  pairingCode?: string;
  count?: number;
  message?: string;
}

class EvolutionService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.evolution.apiUrl,
      headers: {
        apikey: config.evolution.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async createInstance(instanceName: string) {
    const { data } = await this.client.post('/instance/create', {
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    });
    return data;
  }

  async getQRCode(instanceName: string): Promise<QRCodeData> {
    console.log('[QR] Getting QR for:', instanceName);
    
    try {
      const state = await this.getConnectionState(instanceName);
      const currentState = state?.instance?.state || state?.state;
      console.log('[QR] Current state:', currentState);
      
      if (currentState === 'open' || currentState === 'connected') {
        return { count: 0, message: 'Already connected' };
      }
      
      if (currentState === 'connecting') {
        console.log('[QR] Instance is connecting, waiting 2s...');
        await new Promise(r => setTimeout(r, 2000));
        
        const retryState = await this.getConnectionState(instanceName);
        const retryStateStr = retryState?.instance?.state || retryState?.state;
        if (retryStateStr === 'open' || retryStateStr === 'connected') {
          return { count: 0, message: 'Connected' };
        }
      }
    } catch (e) {
      console.log('[QR] State check error:', e);
    }
    
    for (let i = 0; i < 3; i++) {
      try {
        const data = await this.client.get(\`/instance/connect/\${instanceName}\`);
        console.log(\`[QR] Attempt \${i + 1}:\`, JSON.stringify(data.data).substring(0, 200));
        
        const result = data.data;
        
        if (result?.base64 || result?.qrcode) {
          return { base64: result.base64 || result.qrcode, count: result.count || 1 };
        }
        
        if (result?.code || result?.pairingCode) {
          return { code: result.code || result.pairingCode, count: result.count || 1 };
        }
        
        if (result?.count === 0) {
          console.log('[QR] No QR yet, waiting...');
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        
        return result;
      } catch (e: any) {
        console.log(\`[QR] Attempt \${i + 1} error:\`, e.message);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    return this.getQRCodeWebSocket(instanceName);
  }

  async getQRCodeWebSocket(instanceName: string): Promise<QRCodeData> {
    return new Promise((resolve, reject) => {
      const baseUrl = config.evolution.apiUrl.replace('http', 'ws');
      const endpoints = ['', '/websocket', '/ws', '/evolutionWS'];
      
      const tryEndpoint = (idx: number) => {
        if (idx >= endpoints.length) {
          reject(new Error('All WebSocket endpoints failed'));
          return;
        }
        
        const endpoint = endpoints[idx];
        console.log(\`[WS] Trying \${endpoint || '(root)'}...\`);
        
        try {
          const ws = new WebSocket(baseUrl + endpoint, {
            headers: { apikey: config.evolution.apiKey }
          });
          
          const timer = setTimeout(() => {
            ws.close();
            tryEndpoint(idx + 1);
          }, 3000);
          
          ws.on('open', () => {
            console.log(\`[WS] Connected via \${endpoint}\`);
            ws.send(JSON.stringify({ action: 'subscribe', instance: instanceName }));
          });
          
          ws.on('message', (msg: Buffer) => {
            try {
              const data = JSON.parse(msg.toString());
              console.log('[WS] Msg:', JSON.stringify(data).substring(0, 150));
              
              const qr = data.data?.qrcode || data.data?.base64 || data.qrcode;
              if (qr) {
                clearTimeout(timer);
                ws.close();
                resolve({ base64: qr, count: 1 });
              }
            } catch (e) {}
          });
          
          ws.on('error', () => {
            clearTimeout(timer);
            tryEndpoint(idx + 1);
          });
          
          ws.on('close', () => clearTimeout(timer));
        } catch (e) {
          tryEndpoint(idx + 1);
        }
      };
      
      tryEndpoint(0);
    });
  }

  async getConnectionState(instanceName: string) {
    const { data } = await this.client.get(\`/instance/connectionState/\${instanceName}\`);
    return data;
  }

  async sendText(instanceName: string, number: string, text: string) {
    const { data } = await this.client.post(\`/message/sendText/\${instanceName}\`, {
      number,
      text,
    });
    return data;
  }

  async deleteInstance(instanceName: string) {
    const { data } = await this.client.delete(\`/instance/delete/\${instanceName}\`);
    return data;
  }

  async fetchInstances() {
    const { data } = await this.client.get('/instance/fetchInstances');
    return data;
  }

  async getInstanceInfo(instanceName: string) {
    const { data } = await this.client.get('/instance/fetchInstances', {
      params: { instanceName },
    });
    return data;
  }

  async logout(instanceName: string) {
    const { data } = await this.client.delete(\`/instance/logout/\${instanceName}\`);
    return data;
  }
}

export const evolutionService = new EvolutionService();
`;

conn.on('ready', () => {
    console.log('=== 上传新的 evolution.ts ===\n');
    
    const cmd = `cat > /opt/evolution-whatsapp/backend/src/services/evolution.ts << 'ENDFILE'
${evolutionService}
ENDFILE`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) { console.error('Error:', err); conn.end(); return; }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => {
            console.log('\n文件已上传');
            
            // 验证文件
            conn.exec('head -20 /opt/evolution-whatsapp/backend/src/services/evolution.ts', (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n开始重建...');
                    
                    conn.exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml build backend', (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n重建完成，重启服务...');
                            
                            conn.exec('cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d', (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n=== 完成 ===');
                                    console.log('请刷新 http://8.222.170.254 尝试绑定 WhatsApp');
                                    conn.end();
                                });
                            });
                        });
                    });
                });
            });
        });
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
