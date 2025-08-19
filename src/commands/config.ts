import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, TextChannel, ChannelType } from 'discord.js';
import { writeFileSync } from 'fs';
import path from 'path';

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Bot ayarlarını yönetir')
  .addSubcommand(subcommand =>
    subcommand
      .setName('set')
      .setDescription('Bir ayarı değiştirir')
      .addStringOption(option =>
        option
          .setName('type')
          .setDescription('Ayar türü')
          .setRequired(true)
          .addChoices(
            { name: 'Log Kanalı', value: 'logChannel' },
            { name: 'Transcript Kanalı', value: 'transcriptChannel' },
            { name: 'Yetkili Rol', value: 'staffRole' },
            { name: 'Ticket Kategorisi', value: 'ticketCategory' },
            { name: 'Maksimum Ticket Sayısı', value: 'maxTickets' },
            { name: 'Otomatik Kapatma (Saat)', value: 'autoCloseHours' }
          )
      )
      .addChannelOption(option =>
        option
          .setName('log_channel')
          .setDescription('Log kanalını seçin')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addChannelOption(option =>
        option
          .setName('transcript_channel')
          .setDescription('Transcript kanalını seçin')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
      .addRoleOption(option =>
        option
          .setName('staff_role')
          .setDescription('Yetkili rolünü seçin')
          .setRequired(false)
      )
      .addChannelOption(option =>
        option
          .setName('ticket_category')
          .setDescription('Ticket kategorisini seçin')
          .addChannelTypes(ChannelType.GuildCategory)
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('max_tickets')
          .setDescription('Maksimum ticket sayısı (1-10)')
          .setMinValue(1)
          .setMaxValue(10)
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('auto_close_hours')
          .setDescription('Otomatik kapatma süresi (1-168 saat)')
          .setMinValue(1)
          .setMaxValue(168)
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('Mevcut ayarları gösterir')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('test')
      .setDescription('Ayarları test eder')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'set':
        await handleConfigSet(interaction);
        break;
      case 'view':
        await handleConfigView(interaction);
        break;
      case 'test':
        await handleConfigTest(interaction);
        break;
      default:
        await interaction.reply({
          content: '❌ Bilinmeyen alt komut!',
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('Config komut hatası:', error);
    await interaction.reply({
      content: '❌ Komut çalıştırılırken bir hata oluştu!',
      ephemeral: true
    });
  }
}

async function handleConfigSet(interaction: ChatInputCommandInteraction) {
  const type = interaction.options.getString('type', true);
  
  try {
    let value: string | number;
    let displayValue: string;

    switch (type) {
      case 'logChannel': {
        const channel = interaction.options.getChannel('log_channel');
        if (!channel) {
          await interaction.reply({
            content: '❌ Log kanalı seçilmedi!',
            ephemeral: true
          });
          return;
        }
        value = channel.id;
        displayValue = `#${channel.name}`;
        global.config.channels.logChannelId = value;
        break;
      }
      case 'transcriptChannel': {
        const channel = interaction.options.getChannel('transcript_channel');
        if (!channel) {
          await interaction.reply({
            content: '❌ Transcript kanalı seçilmedi!',
            ephemeral: true
          });
          return;
        }
        value = channel.id;
        displayValue = `#${channel.name}`;
        global.config.channels.transcriptChannelId = value;
        break;
      }
      case 'staffRole': {
        const role = interaction.options.getRole('staff_role');
        if (!role) {
          await interaction.reply({
            content: '❌ Yetkili rolü seçilmedi!',
            ephemeral: true
          });
          return;
        }
        value = role.id;
        displayValue = `@${role.name}`;
        global.config.roles.staffRoleId = value;
        break;
      }
      case 'ticketCategory': {
        const category = interaction.options.getChannel('ticket_category');
        if (!category) {
          await interaction.reply({
            content: '❌ Ticket kategorisi seçilmedi!',
            ephemeral: true
          });
          return;
        }
        value = category.id;
        displayValue = `${category.name}`;
        global.config.ticket.categoryId = value;
        break;
      }
      case 'maxTickets': {
        const maxTickets = interaction.options.getInteger('max_tickets');
        if (!maxTickets) {
          await interaction.reply({
            content: '❌ Maksimum ticket sayısı belirtilmedi!',
            ephemeral: true
          });
          return;
        }
        value = maxTickets;
        displayValue = maxTickets.toString();
        global.config.ticket.maxTicketsPerUser = maxTickets;
        break;
      }
      case 'autoCloseHours': {
        const hours = interaction.options.getInteger('auto_close_hours');
        if (!hours) {
          await interaction.reply({
            content: '❌ Otomatik kapatma süresi belirtilmedi!',
            ephemeral: true
          });
          return;
        }
        value = hours;
        displayValue = `${hours} saat`;
        global.config.ticket.autoCloseAfterHours = hours;
        break;
      }
      default:
        await interaction.reply({
          content: '❌ Bilinmeyen ayar türü!',
          ephemeral: true
        });
        return;
    }

    // Config dosyasını kaydet
    const configPath = path.join(__dirname, '../../config.json');
    writeFileSync(configPath, JSON.stringify(global.config, null, 2));

    await interaction.reply({
      content: `✅ **${type}** ayarı **${displayValue}** olarak güncellendi!`,
      ephemeral: true
    });

  } catch (error) {
    console.error('Config set hatası:', error);
    await interaction.reply({
      content: '❌ Ayar güncellenirken bir hata oluştu!',
      ephemeral: true
    });
  }
}

async function handleConfigView(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Bot Ayarları')
    .setColor(global.config.colors.primary)
    .addFields([
      {
        name: '📝 Log Kanalı',
        value: global.config.channels.logChannelId ? `<#${global.config.channels.logChannelId}>` : '❌ Ayarlanmamış',
        inline: true
      },
      {
        name: '📄 Transcript Kanalı',
        value: global.config.channels.transcriptChannelId ? `<#${global.config.channels.transcriptChannelId}>` : '❌ Ayarlanmamış',
        inline: true
      },
      {
        name: '👥 Yetkili Rol',
        value: global.config.roles.staffRoleId ? `<@&${global.config.roles.staffRoleId}>` : '❌ Ayarlanmamış',
        inline: true
      },
      {
        name: '📁 Ticket Kategorisi',
        value: global.config.ticket.categoryId ? `<#${global.config.ticket.categoryId}>` : '❌ Ayarlanmamış',
        inline: true
      },
      {
        name: '🎫 Maksimum Ticket',
        value: global.config.ticket.maxTicketsPerUser.toString(),
        inline: true
      },
      {
        name: '⏰ Otomatik Kapatma',
        value: `${global.config.ticket.autoCloseAfterHours} saat`,
        inline: true
      }
    ])
    .setTimestamp()
    .setFooter({ text: 'Bot Ayarları' });

  await interaction.reply({ embeds: [embed] });
}

async function handleConfigTest(interaction: ChatInputCommandInteraction) {
  const results = [];

  // Log kanalını test et
  try {
    const logChannel = await interaction.guild?.channels.fetch(global.config.channels.logChannelId);
    results.push(`📝 Log Kanalı: ${logChannel ? '✅ Çalışıyor' : '❌ Bulunamadı'}`);
  } catch {
    results.push('📝 Log Kanalı: ❌ Bulunamadı');
  }

  // Transcript kanalını test et
  try {
    const transcriptChannel = await interaction.guild?.channels.fetch(global.config.channels.transcriptChannelId);
    results.push(`📄 Transcript Kanalı: ${transcriptChannel ? '✅ Çalışıyor' : '❌ Bulunamadı'}`);
  } catch {
    results.push('📄 Transcript Kanalı: ❌ Bulunamadı');
  }

  // Yetkili rolü test et
  try {
    const staffRole = await interaction.guild?.roles.fetch(global.config.roles.staffRoleId);
    results.push(`👥 Yetkili Rol: ${staffRole ? '✅ Çalışıyor' : '❌ Bulunamadı'}`);
  } catch {
    results.push('👥 Yetkili Rol: ❌ Bulunamadı');
  }

  // Ticket kategorisini test et
  try {
    const ticketCategory = await interaction.guild?.channels.fetch(global.config.ticket.categoryId);
    results.push(`📁 Ticket Kategorisi: ${ticketCategory ? '✅ Çalışıyor' : '❌ Bulunamadı'}`);
  } catch {
    results.push('📁 Ticket Kategorisi: ❌ Bulunamadı');
  }

  const embed = new EmbedBuilder()
    .setTitle('🧪 Ayar Test Sonuçları')
    .setDescription(results.join('\n'))
    .setColor(global.config.colors.primary)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
} 