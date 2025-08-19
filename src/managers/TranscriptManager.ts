import { Ticket } from '../utils/DatabaseManager';
import moment from 'moment';

export class TranscriptManager {
  async createTranscript(ticket: Ticket): Promise<void> {
    try {
      // Transcript içeriğini oluştur
      const transcriptContent = this.generateTranscriptContent(ticket);

      // Database'e transcript ekle
      const transcript = global.database.createTranscript(
        ticket.id,
        transcriptContent,
        ticket.closedBy || 'System'
      );

      // Log gönder (sadece database'e kaydet, log kanalına mesaj gönderme)
      global.logger.logTranscriptCreated(transcript.id, ticket.id, transcript.createdBy);

    } catch (error) {
      console.error('Transcript oluşturulamadı:', error);
    }
  }

  private generateTranscriptContent(ticket: Ticket): string {
    let content = '';
    
    // Header
    content += '='.repeat(50) + '\n';
    content += `TICKET TRANSCRIPT - ${ticket.id}\n`;
    content += '='.repeat(50) + '\n\n';
    
    // Ticket bilgileri
    content += `Ticket ID: ${ticket.id}\n`;
    content += `Kullanıcı ID: ${ticket.userId}\n`;
    content += `Oluşturulma: ${moment(ticket.createdAt).format('DD/MM/YYYY HH:mm:ss')}\n`;
    content += `Durum: ${ticket.status}\n`;
    
    if (ticket.closedAt) {
      content += `Kapatılma: ${moment(ticket.closedAt).format('DD/MM/YYYY HH:mm:ss')}\n`;
      content += `Kapatan: ${ticket.closedBy}\n`;
    }
    
    content += '\n' + '='.repeat(50) + '\n';
    content += 'MESAJLAR\n';
    content += '='.repeat(50) + '\n\n';
    
    // Mesajları ekle
    ticket.messages.forEach((message, index) => {
      const timestamp = moment(message.timestamp).format('DD/MM/YYYY HH:mm:ss');
      content += `[${timestamp}] ${message.authorId}: ${message.content}\n`;
      
      // Ekler varsa ekle
      if (message.attachments.length > 0) {
        message.attachments.forEach(attachment => {
          content += `[EK] ${attachment}\n`;
        });
      }
      
      content += '\n';
    });
    
    // Footer
    content += '='.repeat(50) + '\n';
    content += `Transcript oluşturulma: ${moment().format('DD/MM/YYYY HH:mm:ss')}\n`;
    content += '='.repeat(50) + '\n';
    
    return content;
  }

  async getTranscript(ticketId: string): Promise<string | null> {
    const transcript = global.database.getTranscript(ticketId);
    return transcript ? transcript.content : null;
  }

  async getAllTranscripts(): Promise<any[]> {
    // Tüm transcript'ları getir
    const database = global.database as any;
    return database.data.transcripts || [];
  }

  async deleteTranscript(transcriptId: string): Promise<boolean> {
    try {
      // Database'den transcript'ı sil
      const database = global.database as any;
      const index = database.data.transcripts.findIndex((t: any) => t.id === transcriptId);
      
      if (index !== -1) {
        database.data.transcripts.splice(index, 1);
        database.saveDatabase();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Transcript silinemedi:', error);
      return false;
    }
  }
} 