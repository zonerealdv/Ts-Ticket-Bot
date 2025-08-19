import { TextChannel, EmbedBuilder, ColorResolvable } from 'discord.js';

export class Logger {
  private getLogChannel(): TextChannel | null {
    const client = global.client;
    if (!client) return null;
    
    const channel = client.channels.cache.get(global.config.channels.logChannelId) as TextChannel;
    return channel || null;
  }

  private getTranscriptChannel(): TextChannel | null {
    const client = global.client;
    if (!client) return null;
    
    const channel = client.channels.cache.get(global.config.channels.transcriptChannelId) as TextChannel;
    return channel || null;
  }

  private createEmbed(title: string, description: string, color: ColorResolvable, fields?: any[]): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    if (fields) {
      embed.addFields(fields);
    }

    return embed;
  }

  async log(message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO', data?: any): Promise<void> {
    const channel = this.getLogChannel();
    if (!channel) return;

    let color: ColorResolvable;
    let emoji: string;

    switch (type) {
      case 'SUCCESS':
        color = global.config.colors.success;
        emoji = '✅';
        break;
      case 'WARNING':
        color = global.config.colors.warning;
        emoji = '⚠️';
        break;
      case 'ERROR':
        color = global.config.colors.error;
        emoji = '❌';
        break;
      default:
        color = global.config.colors.primary;
        emoji = 'ℹ️';
    }

    const embed = this.createEmbed(
      `${emoji} ${type}`,
      message,
      color,
      data ? Object.entries(data).map(([key, value]) => ({
        name: key,
        value: String(value),
        inline: true
      })) : undefined
    );

    try {
      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Log gönderilemedi:', error);
    }
  }

  async logTicketCreated(ticketId: string, userId: string, channelId: string, reason?: string): Promise<void> {
    const logData: any = {
      'Ticket ID': ticketId,
      'Kullanıcı': `<@${userId}>`,
      'Kanal ID': channelId
    };

    if (reason) {
      logData['Sebep'] = reason;
    }

    await this.log('Yeni ticket oluşturuldu', 'SUCCESS', logData);

    // Database'e log ekle
    global.database.addLog('ticket_created', userId, {
      ticketId,
      channelId,
      reason
    });
  }

  async logTicketClosed(ticketId: string, userId: string, closedBy: string, satisfaction?: string): Promise<void> {
    const logData: any = {
      'Ticket ID': ticketId,
      'Kullanıcı': `<@${userId}>`,
      'Kapatan': `<@${closedBy}>`
    };

    if (satisfaction) {
      const satisfactionTexts = {
        'very_satisfied': '😄 Çok Memnun',
        'satisfied': '🙂 Memnun',
        'neutral': '😐 Orta',
        'dissatisfied': '😕 Memnun Değil',
        'very_dissatisfied': '😠 Hiç Memnun Değil'
      };
      logData['Memnunluk'] = satisfactionTexts[satisfaction as keyof typeof satisfactionTexts];
    }

    await this.log('Ticket kapatıldı', 'WARNING', logData);

    // Database'e log ekle
    global.database.addLog('ticket_closed', closedBy, {
      ticketId,
      userId,
      satisfaction
    });
  }

  async logTranscriptCreated(transcriptId: string, ticketId: string, createdBy: string): Promise<void> {
    // Transcript oluşturma log'unu kaldırdık - sadece ticket kapatıldığında log atılacak
    // Database'e log ekle
    global.database.addLog('transcript_created', createdBy, {
      transcriptId,
      ticketId
    });
  }

  async sendTranscript(transcriptContent: string, ticketId: string): Promise<void> {
    const channel = this.getTranscriptChannel();
    if (!channel) return;

    const embed = this.createEmbed(
      '📄 Transcript',
      `Ticket ${ticketId} için transcript`,
      global.config.colors.primary
    );

    try {
      // Transcript dosyasını oluştur ve gönder
      const buffer = Buffer.from(transcriptContent, 'utf-8');
      await channel.send({
        embeds: [embed],
        files: [{
          attachment: buffer,
          name: `transcript-${ticketId}.txt`
        }]
      });
    } catch (error) {
      console.error('Transcript gönderilemedi:', error);
    }
  }
} 