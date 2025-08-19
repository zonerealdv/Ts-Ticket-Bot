import { 
  Guild, 
  TextChannel, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ChannelType,
  OverwriteType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { Ticket } from '../utils/DatabaseManager';

export class TicketManager {
  async getFirstOpenTicketForUser(userId: string) : Promise<Ticket | undefined> {
    const tickets = global.database.getUserTickets(userId);
    return tickets.find(t => t.status === 'open');
  }

  createTicketModal(): ModalBuilder {
    const modal = new ModalBuilder()
      .setCustomId('ticket_reason_modal')
      .setTitle('🎫 Ticket Oluştur');

    const reasonInput = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Ticket Sebebi')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Lütfen ticket açma sebebinizi detaylı bir şekilde açıklayın...')
      .setRequired(true)
      .setMinLength(10)
      .setMaxLength(1000);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
    modal.addComponents(firstActionRow);

    return modal;
  }

  async createTicket(guild: Guild, userId: string, username: string, reason?: string): Promise<Ticket | null> {
    try {
      // Kullanıcının açık ticket'ı var mı?
      const userTickets = global.database.getUserTickets(userId);
      const openTickets = userTickets.filter(t => t.status === 'open');
      if (openTickets.length > 0) {
        throw new Error('Açık bir ticketınız zaten var!');
      }
      // Yine de üst sınırı koru (ileri kullanım için)
      if (openTickets.length >= global.config.ticket.maxTicketsPerUser) {
        throw new Error('Maksimum ticket sayısına ulaştınız!');
      }

      // Ticket kanalını oluştur
      const channel = await guild.channels.create({
        name: `ticket-${username}`,
        type: ChannelType.GuildText,
        parent: global.config.ticket.categoryId.replace(/[<#>]/g, ''),
        permissionOverwrites: [
          {
            id: guild.id,
            type: OverwriteType.Role,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: userId,
            type: OverwriteType.Member,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: global.config.roles.staffRoleId.replace(/[<@&>]/g, ''),
            type: OverwriteType.Role,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages
            ]
          }
        ]
      });

      // Database'e ticket ekle
      const ticket = global.database.createTicket(userId, channel.id, reason);

      // Hoş geldin mesajını gönder
      await this.sendWelcomeMessage(channel, ticket);

      // Log gönder
      await global.logger.logTicketCreated(ticket.id, userId, channel.id, reason);

      return ticket;
    } catch (error) {
      console.error('Ticket oluşturulamadı:', error);
      return null;
    }
  }

  private async sendWelcomeMessage(channel: TextChannel, ticket: Ticket): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Ticket Sistemi')
      .setDescription(`Hoş geldiniz! Ticket #${ticket.id} oluşturuldu.\n\nLütfen sorununuzu detaylı bir şekilde açıklayın. Yetkili ekibimiz en kısa sürede size yardımcı olacaktır.`)
      .setColor(global.config.colors.primary)
      .setTimestamp()
      .addFields([
        {
          name: '📋 Kurallar',
          value: '• Saygılı olun\n• Spam yapmayın\n• Gereksiz mesaj göndermeyin',
          inline: false
        },
        {
          name: '⏰ Yanıt Süresi',
          value: '24 saat içinde yanıt alacaksınız',
          inline: true
        }
      ]);

    // Ticket sebebi varsa ekle
    if (ticket.reason) {
      embed.addFields({
        name: '🎯 Ticket Açma Sebebi',
        value: `\`\`\`\n${ticket.reason}\n\`\`\``,
        inline: false
      });
    }

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Ticket Kapat')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒'),
        new ButtonBuilder()
          .setCustomId('manage_members')
          .setLabel('Üye Ekle/Kaldır')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👥')
      );

    await channel.send({
      content: `<@${ticket.userId}>`,
      embeds: [embed],
      components: [row]
    });
  }

  async closeTicket(channelId: string, closedBy: string): Promise<boolean> {
    try {
      const ticket = global.database.getTicket(channelId);
      if (!ticket) return false;

      // Memnunluk değerlendirmesi için mesaj gönder
      await this.sendSatisfactionMessage(channelId, ticket);
      return true;
    } catch (error) {
      console.error('Ticket kapatılamadı:', error);
      return false;
    }
  }

  private async sendSatisfactionMessage(channelId: string, ticket: any): Promise<void> {
    const channel = await global.client.channels.fetch(channelId) as TextChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🎫 Ticket Kapatma')
      .setDescription('Ticket kapatılmadan önce lütfen destek hizmetimizi değerlendirin.')
      .setColor(global.config.colors.primary)
      .addFields([
        {
          name: '📊 Değerlendirme',
          value: 'Aşağıdaki menüden memnuniyet seviyenizi seçin.',
          inline: false
        }
      ])
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('satisfaction_select')
      .setPlaceholder('Memnuniyet seviyenizi seçin...')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Çok Memnun')
          .setDescription('Hizmetimizden çok memnun kaldınız')
          .setValue('very_satisfied')
          .setEmoji('😄'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Memnun')
          .setDescription('Hizmetimizden memnun kaldınız')
          .setValue('satisfied')
          .setEmoji('🙂'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Orta')
          .setDescription('Hizmetimiz orta seviyede')
          .setValue('neutral')
          .setEmoji('😐'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Memnun Değil')
          .setDescription('Hizmetimizden memnun değilsiniz')
          .setValue('dissatisfied')
          .setEmoji('😕'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Hiç Memnun Değil')
          .setDescription('Hizmetimizden hiç memnun değilsiniz')
          .setValue('very_dissatisfied')
          .setEmoji('😠')
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    await channel.send({
      embeds: [embed],
      components: [row]
    });
  }

  async handleSatisfactionSelect(channelId: string, satisfaction: string, userId: string): Promise<void> {
    try {
      const ticket = global.database.getTicket(channelId);
      if (!ticket) return;

      // Memnunluk değerlendirmesini kaydet
      global.database.addSatisfaction(channelId, satisfaction as any);

      // Ticket'ı kapat
      const closedTicket = global.database.closeTicket(channelId, userId);
      if (!closedTicket) return;

      // Transcript oluştur
      await global.transcriptManager.createTranscript(closedTicket);

      // Transcript'i log kanalına gönder
      const transcriptContent = await global.transcriptManager.getTranscript(closedTicket.id);
      if (transcriptContent) {
        await global.logger.sendTranscript(transcriptContent, closedTicket.id);
      }

      // Önce teşekkür mesajı gönder
      await this.sendThankYouMessage(channelId, satisfaction);

      // 8 saniye sonra kanalı sil
      setTimeout(async () => {
        try {
          const channel = await global.client.channels.fetch(channelId) as TextChannel;
          if (channel) {
            await channel.delete();
          }
        } catch (error) {
          console.error('Kanal silinemedi:', error);
        }
      }, 8000);

      // Log gönder (memnunluk ile birlikte)
      await global.logger.logTicketClosed(ticket.id, ticket.userId, userId, satisfaction);

    } catch (error) {
      console.error('Memnunluk değerlendirmesi işlenemedi:', error);
    }
  }

  private async updateSatisfactionMessage(channelId: string, satisfaction: string, ticket?: any): Promise<void> {
    const channel = await global.client.channels.fetch(channelId) as TextChannel;
    if (!channel) return;

    const satisfactionEmojis = {
      'very_satisfied': '😄',
      'satisfied': '🙂',
      'neutral': '😐',
      'dissatisfied': '😕',
      'very_dissatisfied': '😠'
    };

    const satisfactionTexts = {
      'very_satisfied': 'Çok Memnun',
      'satisfied': 'Memnun',
      'neutral': 'Orta',
      'dissatisfied': 'Memnun Değil',
      'very_dissatisfied': 'Hiç Memnun Değil'
    };

    const embed = new EmbedBuilder()
      .setTitle('🎫 Ticket Kapatıldı')
      .setDescription(`Değerlendirmeniz için teşekkürler!\n\n**Seçiminiz:** ${satisfactionEmojis[satisfaction as keyof typeof satisfactionEmojis]} ${satisfactionTexts[satisfaction as keyof typeof satisfactionTexts]}`)
      .setColor(global.config.colors.primary)
      .addFields([
        {
          name: '📝 Transcript',
          value: 'Ticket konuşması log kanalına kaydedildi.',
          inline: true
        },
        {
          name: '⏰ Kapatma',
          value: 'Bu kanal 5 saniye sonra silinecek.',
          inline: true
        }
      ])
      .setTimestamp();

    // Son mesajı bul ve güncelle
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const lastMessage = messages.find(msg => 
        msg.author.id === global.client.user?.id && 
        msg.embeds.length > 0 && 
        msg.embeds[0].title === '🎫 Ticket Kapatma'
      );

      if (lastMessage) {
        // Sadece embed'i güncelle ve seçim menüsünü kaldır
        await lastMessage.edit({ embeds: [embed], components: [] });
      } else {
        // Eğer mesaj bulunamazsa yeni mesaj gönder
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Mesaj güncellenemedi:', error);
      // Hata durumunda yeni mesaj gönder
      await channel.send({ embeds: [embed] });
    }
  }

  private async sendThankYouMessage(channelId: string, satisfaction: string): Promise<void> {
    const channel = await global.client.channels.fetch(channelId) as TextChannel;
    if (!channel) return;

    const satisfactionEmojis = {
      'very_satisfied': '😄',
      'satisfied': '🙂',
      'neutral': '😐',
      'dissatisfied': '😕',
      'very_dissatisfied': '😠'
    };

    const satisfactionTexts = {
      'very_satisfied': 'Çok Memnun',
      'satisfied': 'Memnun',
      'neutral': 'Orta',
      'dissatisfied': 'Memnun Değil',
      'very_dissatisfied': 'Hiç Memnun Değil'
    };

    const embed = new EmbedBuilder()
      .setTitle('🎫 Değerlendirmeniz İçin Teşekkürler!')
      .setDescription(`Değerlendirmeniz için teşekkürler!\n\n**Seçiminiz:** ${satisfactionEmojis[satisfaction as keyof typeof satisfactionEmojis]} ${satisfactionTexts[satisfaction as keyof typeof satisfactionTexts]}\n\nİyi günler dileriz! 👋`)
      .setColor(global.config.colors.success)
      .addFields([
        {
          name: '⏰ Kapatma Bilgisi',
          value: 'Ticketınız birazdan kapatılıyor. Bu kanal kısa süre içinde silinecek.',
          inline: false
        }
      ])
      .setTimestamp();

    // Memnuniyet mesajını bul ve güncelle
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const lastMessage = messages.find(msg => 
        msg.author.id === global.client.user?.id && 
        msg.embeds.length > 0 && 
        msg.embeds[0].title === '🎫 Ticket Kapatma'
      );

      if (lastMessage) {
        await lastMessage.edit({ embeds: [embed], components: [] });
      } else {
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Teşekkür mesajı gönderilemedi:', error);
      await channel.send({ embeds: [embed] });
    }
  }

  private async sendClosingMessage(channelId: string): Promise<void> {
    const channel = await global.client.channels.fetch(channelId) as TextChannel;
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('🎫 Ticket Kapatılıyor')
      .setDescription('Ticket kapatılıyor...\n\n**Transcript log kanalına kaydedildi.**\nBu kanal 5 saniye sonra silinecek.')
      .setColor(global.config.colors.warning)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  }

  async addMessage(channelId: string, message: any): Promise<void> {
    const messageData = {
      id: message.id,
      authorId: message.author.id,
      content: message.content,
      timestamp: new Date(),
      attachments: message.attachments.map((a: any) => a.url)
    };

    global.database.addMessage(channelId, messageData);
  }

  async getTicketInfo(channelId: string): Promise<Ticket | undefined> {
    return global.database.getTicket(channelId);
  }

  async getUserTicketCount(userId: string): Promise<number> {
    const tickets = global.database.getUserTickets(userId);
    return tickets.filter(t => t.status === 'open').length;
  }
} 