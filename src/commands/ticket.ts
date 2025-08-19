import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Ticket yönetim komutları')
  .addSubcommand(subcommand =>
    subcommand
      .setName('info')
      .setDescription('Ticket bilgilerini gösterir')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('close')
      .setDescription('Ticket\'ı kapatır')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'info':
        await handleTicketInfo(interaction);
        break;
      case 'close':
        await handleTicketClose(interaction);
        break;
      default:
        await interaction.reply({
          content: '❌ Bilinmeyen alt komut!',
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('Ticket komut hatası:', error);
    await interaction.reply({
      content: '❌ Komut çalıştırılırken bir hata oluştu!',
      ephemeral: true
    });
  }
}

async function handleTicketInfo(interaction: ChatInputCommandInteraction) {
  const ticket = global.database.getTicket(interaction.channelId);
  
  if (!ticket) {
    await interaction.reply({
      content: '❌ Bu kanal bir ticket değil!',
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket #${ticket.id}`)
    .setColor(global.config.colors.primary)
    .addFields([
      {
        name: '📊 Durum',
        value: ticket.status === 'open' ? '🟢 Açık' : '🔴 Kapalı',
        inline: true
      },
      {
        name: '👤 Kullanıcı',
        value: `<@${ticket.userId}>`,
        inline: true
      },
      {
        name: '📅 Oluşturulma',
        value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:R>`,
        inline: true
      },
      {
        name: '💬 Mesaj Sayısı',
        value: ticket.messages.length.toString(),
        inline: true
      }
    ])
    .setTimestamp();

  if (ticket.closedAt) {
    embed.addFields({
      name: '🔒 Kapatılma',
      value: `<t:${Math.floor(ticket.closedAt.getTime() / 1000)}:R>`,
      inline: true
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleTicketClose(interaction: ChatInputCommandInteraction) {
  const success = await global.ticketManager.closeTicket(interaction.channelId, interaction.user.id);
  
  if (success) {
    await interaction.reply({
      content: '✅ Ticket başarıyla kapatıldı!',
      ephemeral: true
    });
  } else {
    await interaction.reply({
      content: '❌ Ticket kapatılamadı!',
      ephemeral: true
    });
  }
}

// transcript alt komutu kaldırıldı (otomatik transcript oluşturuluyor)