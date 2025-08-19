import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, TextChannel } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Ticket panel sistemini kurar')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    // Ayarları kontrol et
    const missingSettings = [];
    
    if (!global.config.channels.logChannelId) missingSettings.push('📝 Log Kanalı');
    if (!global.config.channels.transcriptChannelId) missingSettings.push('📄 Transcript Kanalı');
    if (!global.config.roles.staffRoleId) missingSettings.push('👥 Yetkili Rol');
    if (!global.config.ticket.categoryId) missingSettings.push('📁 Ticket Kategorisi');
    
    if (missingSettings.length > 0) {
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Eksik Ayarlar')
        .setDescription('Aşağıdaki ayarları `/config set` komutu ile ayarlayın:')
        .setColor(global.config.colors.warning)
        .addFields([
          {
            name: '❌ Eksik Ayarlar',
            value: missingSettings.join('\n'),
            inline: false
          },
          {
            name: '📋 Örnek Kullanım',
            value: '`/config set type:logChannel value:123456789`',
            inline: false
          }
        ])
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Ticket Sistemi')
      .setDescription('Destek almak için aşağıdaki butona tıklayın.')
      .setColor(global.config.colors.primary)
      .addFields([
        {
          name: '📋 Nasıl Çalışır?',
          value: '1. Aşağıdaki butona tıklayın\n2. Sorununuzu detaylı açıklayın\n3. Yetkili ekibimiz size yardımcı olacak',
          inline: false
        },
        {
          name: '⏰ Yanıt Süresi',
          value: '24 saat içinde yanıt alacaksınız',
          inline: true
        },
        {
          name: '📝 Kurallar',
          value: '• Saygılı olun\n• Spam yapmayın\n• Gereksiz mesaj göndermeyin',
          inline: true
        }
      ])
      .setTimestamp()
      .setFooter({ text: 'Ticket Sistemi' });

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('Ticket Oluştur')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎫')
      );

    await interaction.reply({
      content: '✅ Ticket panel başarıyla kuruldu!',
      ephemeral: true
    });

    const channel = interaction.channel as TextChannel;
    if (channel) {
      await channel.send({
        embeds: [embed],
        components: [row]
      });
    }

  } catch (error) {
    console.error('Setup komut hatası:', error);
    await interaction.reply({
      content: '❌ Panel kurulumu sırasında bir hata oluştu!',
      ephemeral: true
    });
  }
} 