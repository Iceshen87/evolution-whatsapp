const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('=== 部署 WebSocket 修复 ===\n');
    
    // 1. 更新后端代码
    const evolutionService = `import axios, { AxiosInstance } from 'axios';
import WebSocket, { ErrorEvent } from 'ws';
import { config } from '../config';

interface QRCodeData {
  qrcode?: string;
  base64?: string;
  code?: string;
  pairingCode?: string;
  count?: number;
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

  /**
   * Get QR code via WebSocket connection
   * Evolution API v2 pushes QR codes through WebSocket
   */
  async getQRCode(instanceName: string): Promise<QRCodeData> {
    return new Promise((resolve, reject) => {
      const wsUrl = config.evolution.apiUrl.replace('http', 'ws') + '/websocket';
      console.log('[Evolution WS] Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl, {
        headers: {
          apikey: config.evolution.apiKey,
        },
      });

      let qrReceived = false;
      let timeout: NodeJS.Timeout;

      // Timeout after 10 seconds
      timeout = setTimeout(() => {
        if (!qrReceived) {
          console.log('[Evolution WS] Timeout, falling back to HTTP');
          ws.close();
          this.getQRCodeHTTP(instanceName).then(resolve).catch(reject);
        }
      }, 10000);

      ws.on('open', () => {
        console.log('[Evolution WS] Connected');
        // Subscribe to instance events
        ws.send(JSON.stringify({
          action: 'subscribe',
          instance: instanceName,
        }));
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('[Evolution WS] Message:', JSON.stringify(message).substring(0, 300));

          // Look for QR code in message
          if (message.data?.qrcode) {
            qrReceived = true;
            clearTimeout(timeout);
            ws.close();
            resolve({
              base64: message.data.qrcode,
              count: 1,
            });
          } else if (message.data?.base64) {
            qrReceived = true;
            clearTimeout(timeout);
            ws.close();
            resolve({
              base64: message.data.base64,
              count: 1,
            });
          } else if (message.event === 'qrcode.updated' || message.event === 'connection.update') {
            const qr = message.data?.qrcode || message.data?.base64 || message.qrcode;
            if (qr) {
              qrReceived = true;
              clearTimeout(timeout);
              ws.close();
              resolve({
                base64: qr,
                count: 1,
              });
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      ws.on('error', (err: ErrorEvent) => {
        console.error('[Evolution WS] Error:', err.message);
        clearTimeout(timeout);
        this.getQRCodeHTTP(instanceName).then(resolve).catch(reject);
      });

      ws.on('close', () => {
        console.log('[Evolution WS] Closed');
        if (!qrReceived) {
          clearTimeout(timeout);
          this.getQRCodeHTTP(instanceName).then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * Fallback HTTP method to get QR code
   */
  private async getQRCodeHTTP(instanceName: string): Promise<QRCodeData> {
    try {
      const { data } = await this.client.get(\`/instance/connect/\${instanceName}\`);
      console.log('[Evolution HTTP] QR response:', JSON.stringify(data).substring(0, 200));
      
      if (data?.pairingCode) {
        return {
          code: data.pairingCode,
          count: data.count || 1,
        };
      }
      
      return data;
    } catch (error: any) {
      console.error('[Evolution HTTP] QR error:', error.response?.data || error.message);
      throw error;
    }
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
    
    // 写入文件
    const writeCmd = `cat > /opt/evolution-whatsapp/backend/src/services/evolution.ts << 'EOFFILE'
${evolutionService}
EOFFILE`;
    
    conn.exec(writeCmd, (err, stream) => {
        if (err) {
            console.error('Write error:', err);
            conn.end();
            return;
        }
        stream.on('close', () => {
            console.log('1. evolution.ts 已更新');
            
            // 2. 更新 package.json 添加 ws 依赖
            conn.exec("cd /opt/evolution-whatsapp/backend && npm install ws @types/ws --save", (err, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n2. ws 依赖已安装');
                    
                    // 3. 重建后端
                    conn.exec("cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml build backend", (err, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n3. 后端已重建');
                            
                            // 4. 重启服务
                            conn.exec("cd /opt/evolution-whatsapp && docker compose -f docker-compose.light.yml up -d", (err, stream) => {
                                stream.on('data', d => process.stdout.write(d.toString()));
                                stream.on('close', () => {
                                    console.log('\n4. 服务已重启');
                                    console.log('\n=== 部署完成 ===');
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

conn.connect({
    host: '8.222.170.254',
    port: 22,
    username: 'root',
    password: 'Teck0358'
});
