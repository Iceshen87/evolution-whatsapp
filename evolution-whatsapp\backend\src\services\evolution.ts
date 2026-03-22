import axios, { AxiosInstance } from 'axios';
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
          ws.close();
          // Fallback to HTTP
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
          console.log('[Evolution WS] Message:', JSON.stringify(message).substring(0, 200));

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
            // Try to extract QR from different message formats
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

      ws.on('error', (err) => {
        console.error('[Evolution WS] Error:', err.message);
        clearTimeout(timeout);
        // Fallback to HTTP
        this.getQRCodeHTTP(instanceName).then(resolve).catch(reject);
      });

      ws.on('close', () => {
        console.log('[Evolution WS] Closed');
        if (!qrReceived) {
          clearTimeout(timeout);
          // Fallback to HTTP
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
      const { data } = await this.client.get(`/instance/connect/${instanceName}`);
      console.log('[Evolution HTTP] QR response:', JSON.stringify(data).substring(0, 200));
      
      // If we get pairingCode, format it for frontend
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
    const { data } = await this.client.get(`/instance/connectionState/${instanceName}`);
    return data;
  }

  async sendText(instanceName: string, number: string, text: string) {
    const { data } = await this.client.post(`/message/sendText/${instanceName}`, {
      number,
      text,
    });
    return data;
  }

  async deleteInstance(instanceName: string) {
    const { data } = await this.client.delete(`/instance/delete/${instanceName}`);
    return data;
  }

  async fetchInstances() {
    const { data } = await this.client.get('/instance/fetchInstances');
    return data;
  }

  async getInstanceInfo(instanceName: string) {
    const { data } = await this.client.get(`/instance/fetchInstances`, {
      params: { instanceName },
    });
    return data;
  }

  async logout(instanceName: string) {
    const { data } = await this.client.delete(`/instance/logout/${instanceName}`);
    return data;
  }
}

export const evolutionService = new EvolutionService();
