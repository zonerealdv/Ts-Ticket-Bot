import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

export interface Ticket {
  id: string;
  channelId: string;
  userId: string;
  reason?: string;
  createdAt: Date;
  closedAt?: Date;
  closedBy?: string;
  status: 'open' | 'closed';
  messages: Message[];
  satisfaction?: 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied' | 'very_dissatisfied';
}

export interface Message {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
  attachments: string[];
}

export interface Transcript {
  id: string;
  ticketId: string;
  content: string;
  createdAt: Date;
  createdBy: string;
}

export interface Log {
  id: string;
  type: 'ticket_created' | 'ticket_closed' | 'transcript_created';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface SatisfactionStats {
  total: number;
  very_satisfied: number;
  satisfied: number;
  neutral: number;
  dissatisfied: number;
  very_dissatisfied: number;
  average: number;
}

export class DatabaseManager {
  private dbPath: string;
  private data = {
    tickets: [] as Ticket[],
    transcripts: [] as Transcript[],
    logs: [] as Log[],
    settings: {
      lastTicketId: 0,
      lastTranscriptId: 0
    }
  };

  constructor() {
    this.dbPath = path.join(__dirname, '../../database.json');
    this.loadDatabase();
  }

  private loadDatabase(): void {
    if (existsSync(this.dbPath)) {
      const fileData = JSON.parse(readFileSync(this.dbPath, 'utf-8'));
      this.data = {
        tickets: fileData.tickets || [],
        transcripts: fileData.transcripts || [],
        logs: fileData.logs || [],
        settings: {
          lastTicketId: fileData.settings?.lastTicketId || 0,
          lastTranscriptId: fileData.settings?.lastTranscriptId || 0
        }
      };
    } else {
      this.saveDatabase();
    }
  }

  private saveDatabase(): void {
    writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  // Ticket işlemleri
  createTicket(userId: string, channelId: string, reason?: string): Ticket {
    const ticket: Ticket = {
      id: `${++this.data.settings.lastTicketId}`,
      channelId,
      userId,
      reason,
      createdAt: new Date(),
      status: 'open',
      messages: []
    };

    this.data.tickets.push(ticket);
    this.saveDatabase();
    return ticket;
  }

  getTicket(channelId: string): Ticket | undefined {
    return this.data.tickets.find(ticket => ticket.channelId === channelId);
  }

  getUserTickets(userId: string): Ticket[] {
    return this.data.tickets.filter(ticket => ticket.userId === userId);
  }

  closeTicket(channelId: string, closedBy: string): Ticket | undefined {
    const ticket = this.getTicket(channelId);
    if (ticket) {
      ticket.status = 'closed';
      ticket.closedAt = new Date();
      ticket.closedBy = closedBy;
      this.saveDatabase();
    }
    return ticket;
  }

  // Memnunluk değerlendirmesi ekle
  addSatisfaction(channelId: string, satisfaction: Ticket['satisfaction']): Ticket | undefined {
    const ticket = this.getTicket(channelId);
    if (ticket) {
      ticket.satisfaction = satisfaction;
      this.saveDatabase();
    }
    return ticket;
  }

  // Memnunluk istatistikleri
  getSatisfactionStats(month?: number, year?: number): SatisfactionStats {
    let tickets = this.data.tickets.filter(t => t.status === 'closed' && t.satisfaction);
    
    // Belirli ay/yıl filtresi
    if (month !== undefined && year !== undefined) {
      tickets = tickets.filter(t => {
        const closedDate = new Date(t.closedAt!);
        return closedDate.getMonth() === month && closedDate.getFullYear() === year;
      });
    }

    const stats: SatisfactionStats = {
      total: tickets.length,
      very_satisfied: tickets.filter(t => t.satisfaction === 'very_satisfied').length,
      satisfied: tickets.filter(t => t.satisfaction === 'satisfied').length,
      neutral: tickets.filter(t => t.satisfaction === 'neutral').length,
      dissatisfied: tickets.filter(t => t.satisfaction === 'dissatisfied').length,
      very_dissatisfied: tickets.filter(t => t.satisfaction === 'very_dissatisfied').length,
      average: 0
    };

    // Ortalama hesapla (1-5 arası)
    if (stats.total > 0) {
      const totalScore = (stats.very_satisfied * 5) + (stats.satisfied * 4) + (stats.neutral * 3) + 
                        (stats.dissatisfied * 2) + (stats.very_dissatisfied * 1);
      stats.average = Math.round((totalScore / stats.total) * 10) / 10;
    }

    return stats;
  }

  // Aylık destek istatistikleri
  getMonthlyStats(month: number, year: number) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const tickets = this.data.tickets.filter(t => {
      const createdDate = new Date(t.createdAt);
      return createdDate >= startDate && createdDate <= endDate;
    });

    const closedTickets = tickets.filter(t => t.status === 'closed');
    const satisfactionStats = this.getSatisfactionStats(month, year);

    return {
      totalCreated: tickets.length,
      totalClosed: closedTickets.length,
      averageResponseTime: this.calculateAverageResponseTime(closedTickets),
      satisfaction: satisfactionStats
    };
  }

  private calculateAverageResponseTime(tickets: Ticket[]): number {
    const responseTimes = tickets
      .filter(t => t.messages.length > 1) // En az 2 mesaj olmalı
      .map(t => {
        const firstUserMessage = t.messages.find(m => m.authorId === t.userId);
        const firstStaffMessage = t.messages.find(m => m.authorId !== t.userId);
        
        if (firstUserMessage && firstStaffMessage) {
          return new Date(firstStaffMessage.timestamp).getTime() - new Date(firstUserMessage.timestamp).getTime();
        }
        return 0;
      })
      .filter(time => time > 0);

    if (responseTimes.length === 0) return 0;
    
    const averageMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return Math.round(averageMs / (1000 * 60)); // Dakika cinsinden
  }

  addMessage(channelId: string, message: Message): void {
    const ticket = this.getTicket(channelId);
    if (ticket) {
      ticket.messages.push(message);
      this.saveDatabase();
    }
  }

  // Transcript işlemleri
  createTranscript(ticketId: string, content: string, createdBy: string): Transcript {
    const transcript: Transcript = {
      id: `TRANSCRIPT-${++this.data.settings.lastTranscriptId}`,
      ticketId,
      content,
      createdAt: new Date(),
      createdBy
    };

    this.data.transcripts.push(transcript);
    this.saveDatabase();
    return transcript;
  }

  getTranscript(ticketId: string): Transcript | undefined {
    return this.data.transcripts.find(transcript => transcript.ticketId === ticketId);
  }

  // Log işlemleri
  addLog(type: Log['type'], userId: string, data: any): void {
    const log: Log = {
      id: `LOG-${Date.now()}`,
      type,
      userId,
      data,
      timestamp: new Date()
    };

    this.data.logs.push(log);
    this.saveDatabase();
  }

  getLogs(limit: number = 100): Log[] {
    return this.data.logs.slice(-limit);
  }

  // Ayarlar
  getSettings() {
    return this.data.settings;
  }

  // Tüm ticketları getir (stats için)
  getAllTickets(): Ticket[] {
    return this.data.tickets;
  }
} 