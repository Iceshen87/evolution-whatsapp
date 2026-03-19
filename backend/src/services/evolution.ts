import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

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

  async getQRCode(instanceName: string) {
    const { data } = await this.client.get(`/instance/connect/${instanceName}`);
    return data;
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
