import { get, set } from 'idb-keyval';

export interface Visitor {
  id: string;
  name: string;
  flatNo: string;
  phone: string;
  photoUrl: string; // base64
  descriptor: number[]; // Float32Array converted to array for storage
  registeredAt: number;
}

export interface Log {
  id: string;
  visitorId: string;
  type: 'IN' | 'OUT';
  timestamp: number;
  purpose?: string;
}

export const db = {
  async getVisitors(): Promise<Visitor[]> {
    return (await get('visitors')) || [];
  },
  async saveVisitor(visitor: Visitor): Promise<void> {
    const visitors = await this.getVisitors();
    visitors.push(visitor);
    await set('visitors', visitors);
  },
  async getLogs(): Promise<Log[]> {
    return (await get('logs')) || [];
  },
  async saveLog(log: Log): Promise<void> {
    const logs = await this.getLogs();
    logs.push(log);
    await set('logs', logs);
  },
  async deleteVisitor(id: string): Promise<void> {
    const visitors = await this.getVisitors();
    await set('visitors', visitors.filter(v => v.id !== id));
    const logs = await this.getLogs();
    await set('logs', logs.filter(l => l.visitorId !== id));
  },
  async getVisitorById(id: string): Promise<Visitor | undefined> {
    const visitors = await this.getVisitors();
    return visitors.find((v) => v.id === id);
  },
  async getLatestLogForVisitor(visitorId: string): Promise<Log | undefined> {
    const logs = await this.getLogs();
    const visitorLogs = logs.filter((l) => l.visitorId === visitorId).sort((a, b) => b.timestamp - a.timestamp);
    return visitorLogs[0];
  }
};
