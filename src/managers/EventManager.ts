import { 
  Events, 
  Interaction, 
  Message, 
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits
} from 'discord.js';

export class EventManager {
  constructor() {
    this.setupEvents();
  }

  private setupEvents(): void {
    const client = global.client;

    // Interaction Create Event
    client.on(Events.InteractionCreate, async (interaction: Interaction) => {
      if (interaction.isChatInputCommand()) {
        await global.commandManager.handleInteraction(interaction);
      } else if (interaction.isButton()) {
        await this.handleButtonInteraction(interaction);
      } else if (interaction.isModalSubmit()) {
        await this.handleModalSubmit(interaction);
      } else if (interaction.isStringSelectMenu()) {
        await this.handleStringSelectMenu(interaction);
      }
    });

    // Message Create Event
    client.on(Events.MessageCreate, async (message: Message) => {
      await this.handleMessageCreate(message);
    });

    // Ready Event
    client.once(Events.ClientReady, async () => {
      console.log(`✅ ${client.user?.tag} olarak giriş yapıldı!`);
      await global.commandManager.registerCommands();
      await global.logger.log('Bot başlatıldı', 'INFO');
    });
  }

  private async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
    try {
      // Stats komutunun sayfa butonları, kendi collector'ı tarafından yönetilir
      // Global handler bunlara dokunmamalı ki acknowledge çakışmaları olmasın
      const customId = interaction.customId || '';
      const messageAny = interaction.message as any;
      const parentCommand = messageAny?.interaction?.commandName;
      if (customId.startsWith('stats_') || parentCommand === 'stats') {
        return;
      }

      switch (interaction.customId) {
        case 'create_ticket':
        case 'manage_members':
        case 'close_ticket':
          // Bu butonlar için defer etmiyoruz
          if (interaction.customId === 'create_ticket') {
            await this.handleCreateTicket(interaction);
          } else if (interaction.customId === 'manage_members') {
            await this.handleManageMembers(interaction);
          } else {
            await this.handleCloseTicket(interaction);
          }
          break;
        default:
          // Diğer butonlar için defer et
          if (!interaction.deferred && !interaction.replied) {
            try {
              await interaction.deferReply({ ephemeral: true });
            } catch (deferError) {
              console.error('Defer reply hatası:', deferError);
              return;
            }
          }

          switch (interaction.customId) {
            default:
              await interaction.editReply({ 
                content: '❌ Bilinmeyen buton!'
              });
          }
      }
    } catch (error) {
      console.error('Button interaction hatası:', error);
      
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ 
            content: '❌ Bir hata oluştu!' 
          });
        } else {
          await interaction.reply({ 
            content: '❌ Bir hata oluştu!',
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error('Error reply hatası:', replyError);
      }
    }
  }

  private async handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    try {
      // Interaction'ı hemen defer et
      if (!interaction.deferred && !interaction.replied) {
        try {
          await interaction.deferReply({ ephemeral: true });
        } catch (deferError) {
          console.error('Defer reply hatası:', deferError);
          return;
        }
      }

      switch (interaction.customId) {
        case 'ticket_reason_modal':
          await this.handleTicketReasonModal(interaction);
          break;
        case 'manage_members_modal':
          await this.handleManageMembersModal(interaction);
          break;
        default:
          await interaction.editReply({ 
            content: '❌ Bilinmeyen modal!'
          });
      }
    } catch (error) {
      console.error('Modal submit hatası:', error);
      
      try {
        await interaction.editReply({ 
          content: '❌ Bir hata oluştu!'
        });
      } catch (editError) {
        console.error('Edit reply hatası:', editError);
      }
    }
  }

  private async handleMessageCreate(message: Message): Promise<void> {
    // Bot mesajlarını yoksay
    if (message.author.bot) return;

    // Ticket kanalında mı kontrol et
    const ticket = global.database.getTicket(message.channelId);
    if (ticket && ticket.status === 'open') {
      // Mesajı database'e ekle
      await global.ticketManager.addMessage(message.channelId, message);
    }
  }

  private async handleCreateTicket(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.guild) return;

    try {
      const userId = interaction.user.id;
      // Kullanıcının açık ticket'ı var mı?
      const openTicket = await global.ticketManager.getFirstOpenTicketForUser(userId);
      if (openTicket) {
        await interaction.reply({
          content: `❌ Zaten açık bir ticketınız var: <#${openTicket.channelId}>. Lütfen mevcut ticket kapanmadan yenisini açmayın.`,
          ephemeral: true
        });
        return;
      }

      const ticketCount = await global.ticketManager.getUserTicketCount(userId);
      if (ticketCount >= global.config.ticket.maxTicketsPerUser) {
        await interaction.reply({
          content: `❌ Maksimum ticket sayısına ulaştınız! (${global.config.ticket.maxTicketsPerUser})`,
          ephemeral: true
        });
        return;
      }

      // Modal göster - defer etmeden önce
      const modal = global.ticketManager.createTicketModal();
      await interaction.showModal(modal);
      
    } catch (error) {
      console.error('Create ticket hatası:', error);
      
      // Modal göstermek için defer etmememiz gerekiyor
      if (!interaction.replied) {
        try {
          await interaction.reply({
            content: '❌ Ticket oluşturulurken bir hata oluştu!',
            ephemeral: true
          });
        } catch (replyError) {
          console.error('Reply hatası:', replyError);
        }
      }
    }
  }

  private async handleCloseTicket(interaction: ButtonInteraction): Promise<void> {
    try {
      const ticket = global.database.getTicket(interaction.channelId);
      
      if (!ticket) {
        await interaction.reply({
          content: '❌ Bu kanal bir ticket değil!',
          ephemeral: true
        });
        return;
      }

      // Yalnızca yetkililer kapatabilsin
      const staffRoleId = (global.config.roles?.staffRoleId || '').toString().replace(/[<@&>]/g, '');
      const hasManagePermission = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ?? false;
      const hasStaffRole = (() => {
        const memberAny = interaction.member as any;
        try {
          return staffRoleId && memberAny?.roles?.cache?.has?.(staffRoleId);
        } catch { return false; }
      })();

      if (!hasManagePermission && !hasStaffRole) {
        await interaction.reply({
          content: '❌ Bu işlemi sadece yetkililer yapabilir!',
          ephemeral: true
        });
        return;
      }

      const success = await global.ticketManager.closeTicket(interaction.channelId, interaction.user.id);
      
      if (success) {
        // Memnuniyet mesajı gösterildi, hiçbir mesaj göndermeye gerek yok
        // Interaction'ı sessizce acknowledge et
        try {
          await interaction.deferUpdate();
        } catch (deferError) {
          console.error('Defer update hatası:', deferError);
        }
      } else {
        await interaction.reply({
          content: '❌ Ticket kapatılamadı!',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Close ticket hatası:', error);
      
      try {
        await interaction.reply({
          content: '❌ Ticket kapatılırken bir hata oluştu!',
          ephemeral: true
        });
      } catch (replyError) {
        console.error('Error reply hatası:', replyError);
      }
    }
  }

  private async handleTranscriptTicket(interaction: ButtonInteraction): Promise<void> {
    try {
      const ticket = global.database.getTicket(interaction.channelId);
      
      if (!ticket) {
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
              content: '❌ Bu kanal bir ticket değil!'
            });
          } else {
            await interaction.reply({
              content: '❌ Bu kanal bir ticket değil!',
              ephemeral: true
            });
          }
        } catch (replyError) {
          console.error('Reply hatası:', replyError);
        }
        return;
      }

      try {
        await global.transcriptManager.createTranscript(ticket);
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
              content: '✅ Transcript başarıyla oluşturuldu!'
            });
          } else {
            await interaction.reply({
              content: '✅ Transcript başarıyla oluşturuldu!',
              ephemeral: true
            });
          }
        } catch (replyError) {
          console.error('Başarı mesajı gönderilemedi:', replyError);
        }
      } catch (transcriptError) {
        console.error('Transcript oluşturma hatası:', transcriptError);
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
              content: '❌ Transcript oluşturulamadı!'
            });
          } else {
            await interaction.reply({
              content: '❌ Transcript oluşturulamadı!',
              ephemeral: true
            });
          }
        } catch (replyError) {
          console.error('Hata mesajı gönderilemedi:', replyError);
        }
      }
    } catch (error) {
      console.error('Transcript ticket hatası:', error);
      
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            content: '❌ Transcript oluşturulurken bir hata oluştu!'
          });
        } else {
          await interaction.reply({
            content: '❌ Transcript oluşturulurken bir hata oluştu!',
            ephemeral: true
          });
        }
      } catch (editError) {
        console.error('Edit reply hatası:', editError);
      }
    }
  }

  private async handleTicketReasonModal(interaction: ModalSubmitInteraction): Promise<void> {
    try {
      const reason = interaction.fields.getTextInputValue('reason');
      
      if (!interaction.guild) return;

      const ticket = await global.ticketManager.createTicket(interaction.guild, interaction.user.id, interaction.user.username, reason);
      
      if (ticket) {
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
              content: `✅ Ticket başarıyla oluşturuldu! <#${ticket.channelId}>`
            });
          } else {
            await interaction.reply({
              content: `✅ Ticket başarıyla oluşturuldu! <#${ticket.channelId}>`,
              ephemeral: true
            });
          }
        } catch (replyError) {
          console.error('Başarı mesajı gönderilemedi:', replyError);
        }
      } else {
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
              content: '❌ Ticket oluşturulamadı!'
            });
          } else {
            await interaction.reply({
              content: '❌ Ticket oluşturulamadı!',
              ephemeral: true
            });
          }
        } catch (replyError) {
          console.error('Hata mesajı gönderilemedi:', replyError);
        }
      }
    } catch (error) {
      console.error('Ticket reason modal hatası:', error);
      
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            content: '❌ Ticket oluşturulurken bir hata oluştu!'
          });
        } else {
          await interaction.reply({
            content: '❌ Ticket oluşturulurken bir hata oluştu!',
            ephemeral: true
          });
        }
      } catch (editError) {
        console.error('Edit reply hatası:', editError);
      }
    }
  }

  private async handleStringSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    try {
      switch (interaction.customId) {
        case 'satisfaction_select':
          await this.handleSatisfactionSelect(interaction);
          break;
        default:
          await interaction.reply({
            content: '❌ Bilinmeyen seçim menüsü!',
            ephemeral: true
          });
      }
    } catch (error) {
      console.error('String select menu hatası:', error);
      
      try {
        await interaction.reply({
          content: '❌ Bir hata oluştu!',
          ephemeral: true
        });
      } catch (replyError) {
        console.error('Error reply hatası:', replyError);
      }
    }
  }

  private async handleSatisfactionSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    try {
      const satisfaction = interaction.values[0];
      
      // Önce menüyü kaldırarak mesajı güncelle (kullanıcı tekrar tıklamasın)
      try {
        await interaction.update({ components: [] });
      } catch (updateError) {
        console.log('Satisfaction mesajı güncellenemedi (muhtemelen daha önce yanıtlanmış):', updateError);
      }

      // Memnunluk değerlendirmesini işle
      await global.ticketManager.handleSatisfactionSelect(interaction.channelId, satisfaction, interaction.user.id);
      
      // Kullanıcıya teşekkür mesajı gönder (followUp olarak)
      try {
        await interaction.followUp({
          content: '✅ Değerlendirmeniz için teşekkürler! Ticket kapatılıyor...',
          ephemeral: true
        });
      } catch (replyError) {
        // Interaction süresi dolmuş olabilir, bu normal
        console.log('Satisfaction followUp hatası (muhtemelen interaction süresi dolmuş):', replyError);
      }
      
    } catch (error) {
      console.error('Satisfaction select hatası:', error);
      
      // Hata durumunda interaction durumu değişmiş olabilir
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            content: '❌ Değerlendirme işlenirken bir hata oluştu!',
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: '❌ Değerlendirme işlenirken bir hata oluştu!',
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.log('Error reply hatası (muhtemelen interaction süresi dolmuş):', replyError);
      }
    }
  }

  private async handleManageMembers(interaction: ButtonInteraction): Promise<void> {
    try {
      const channel = interaction.channel;
      if (!channel || !channel.isTextBased()) {
        await interaction.reply({
          content: '❌ Bu işlem sadece metin kanallarında yapılabilir!',
          ephemeral: true
        });
        return;
      }

      // Kullanıcıya üye ekleme/kaldırma modalı göster
      const modal = new ModalBuilder()
        .setCustomId('manage_members_modal')
        .setTitle('👥 Üye Ekle/Kaldır');

      const userIdInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('Kullanıcı ID')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Eklemek/kaldırmak istediğiniz kullanıcının ID\'sini girin')
        .setRequired(true)
        .setMinLength(17)
        .setMaxLength(20);

      const actionInput = new TextInputBuilder()
        .setCustomId('action')
        .setLabel('İşlem (add/remove)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('add veya remove yazın')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(6);

      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(userIdInput);
      const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(actionInput);
      
      modal.addComponents(firstActionRow, secondActionRow);

      await interaction.showModal(modal);

    } catch (error) {
      console.error('Manage members hatası:', error);
      
      try {
        await interaction.reply({
          content: '❌ Üye yönetimi işlemi başlatılamadı!',
          ephemeral: true
        });
      } catch (replyError) {
        console.error('Error reply hatası:', replyError);
      }
    }
  }

  private async handleManageMembersModal(interaction: ModalSubmitInteraction): Promise<void> {
    try {
      const userId = interaction.fields.getTextInputValue('user_id');
      const action = interaction.fields.getTextInputValue('action').toLowerCase();

      if (action !== 'add' && action !== 'remove') {
        await interaction.editReply({
          content: '❌ Geçersiz işlem! Lütfen "add" veya "remove" yazın.'
        });
        return;
      }

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased() || !('permissionOverwrites' in channel)) {
        await interaction.editReply({
          content: '❌ Bu işlem sadece metin kanallarında yapılabilir!'
        });
        return;
      }

      try {
        const member = await interaction.guild?.members.fetch(userId);
        if (!member) {
          await interaction.editReply({
            content: '❌ Kullanıcı bulunamadı!'
          });
          return;
        }

        if (action === 'add') {
          await (channel as any).permissionOverwrites.create(member, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });
          
          await interaction.editReply({
            content: `✅ ${member.user.tag} kanala eklendi!`
          });
        } else {
          await (channel as any).permissionOverwrites.delete(member);
          
          await interaction.editReply({
            content: `✅ ${member.user.tag} kanaldan kaldırıldı!`
          });
        }

      } catch (fetchError) {
        await interaction.editReply({
          content: '❌ Kullanıcı bulunamadı veya işlem başarısız!'
        });
      }

    } catch (error) {
      console.error('Manage members modal hatası:', error);
      
      try {
        await interaction.editReply({
          content: '❌ Üye yönetimi işlemi başarısız!'
        });
      } catch (replyError) {
        console.error('Error reply hatası:', replyError);
      }
    }
  }
} 