import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Bot istatistiklerini gösterir')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const tickets = global.database.getAllTickets();

    // Son 7 günlük istatistikler
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentTickets = tickets.filter((t: any) => new Date(t.createdAt) > lastWeek).length;

    // Sayfa 1: Genel İstatistikler
    const page1Embed = new EmbedBuilder()
      .setTitle('📊 Genel İstatistikler')
      .setColor(global.config.colors.primary)
      .addFields([
        {
          name: '🎫 Ticket İstatistikleri',
          value: `**Toplam:** ${tickets.length}\n**Açık:** ${tickets.filter((t: any) => t.status === 'open').length}\n**Kapalı:** ${tickets.filter((t: any) => t.status === 'closed').length}`,
          inline: true
        },
        {
          name: '📈 Son 7 Gün',
          value: `**Yeni Ticket:** ${recentTickets}`,
          inline: true
        }
      ])
      .setTimestamp()
      .setFooter({ text: 'Sayfa 1/2 • Ticket Sistemi İstatistikleri' });

    // Sayfa 2: Memnunluk İstatistikleri
    const satisfactionStats = global.database.getSatisfactionStats();
    
    const page2Embed = new EmbedBuilder()
      .setTitle('😊 Memnunluk İstatistikleri')
      .setColor(global.config.colors.primary)
      .addFields([
        {
          name: '📊 Genel Bilgiler',
          value: `**Toplam Değerlendirme:** ${satisfactionStats.total}\n**Ortalama Puan:** ${satisfactionStats.average}/5`,
          inline: false
        }
      ])
      .setTimestamp()
      .setFooter({ text: 'Sayfa 2/2 • Memnunluk İstatistikleri' });

    if (satisfactionStats.total > 0) {
      // Yüzdelik hesaplamalar
      const percentages = {
        very_satisfied: Math.round((satisfactionStats.very_satisfied / satisfactionStats.total) * 100),
        satisfied: Math.round((satisfactionStats.satisfied / satisfactionStats.total) * 100),
        neutral: Math.round((satisfactionStats.neutral / satisfactionStats.total) * 100),
        dissatisfied: Math.round((satisfactionStats.dissatisfied / satisfactionStats.total) * 100),
        very_dissatisfied: Math.round((satisfactionStats.very_dissatisfied / satisfactionStats.total) * 100)
      };

      const satisfactionBreakdown = [
        `😄 Çok Memnun: ${satisfactionStats.very_satisfied} (${percentages.very_satisfied}%)`,
        `🙂 Memnun: ${satisfactionStats.satisfied} (${percentages.satisfied}%)`,
        `😐 Orta: ${satisfactionStats.neutral} (${percentages.neutral}%)`,
        `😕 Memnun Değil: ${satisfactionStats.dissatisfied} (${percentages.dissatisfied}%)`,
        `😠 Hiç Memnun Değil: ${satisfactionStats.very_dissatisfied} (${percentages.very_dissatisfied}%)`
      ].join('\n');

      page2Embed.addFields({
        name: '📈 Detaylı Dağılım',
        value: satisfactionBreakdown,
        inline: false
      });

      // Memnunluk grafiği
      const satisfactionBar = createSatisfactionBar(satisfactionStats);
      page2Embed.addFields({
        name: '📊 Memnunluk Grafiği',
        value: satisfactionBar,
        inline: false
      });
    } else {
      page2Embed.addFields({
        name: '📊 Durum',
        value: 'Henüz memnunluk değerlendirmesi yapılmamış.',
        inline: false
      });
    }

    // Sayfa geçiş butonları
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('stats_prev')
          .setLabel('◀️ Önceki')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('stats_next')
          .setLabel('Sonraki ▶️')
          .setStyle(ButtonStyle.Primary)
      );

    // İlk sayfayı gönder
    const response = await interaction.reply({
      embeds: [page1Embed],
      components: [row],
      fetchReply: true
    });

    // Sayfa geçiş sistemi için collector
    const collector = response.createMessageComponentCollector({
      time: 1800000 // 30 dakika
    });

    let currentPage = 1;
    const pages = [page1Embed, page2Embed];

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        try {
          await i.reply({ content: '❌ Bu butonları sadece komutu kullanan kişi kullanabilir!', ephemeral: true });
        } catch (err) {
          // Zaten yanıtlanmış olabilir; sessizce geç
        }
        return;
      }

      if (i.customId === 'stats_prev') {
        currentPage = Math.max(1, currentPage - 1);
      } else if (i.customId === 'stats_next') {
        currentPage = Math.min(2, currentPage + 1);
      }

      // Butonları güncelle
      const newRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('stats_prev')
            .setLabel('◀️ Önceki')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1),
          new ButtonBuilder()
            .setCustomId('stats_next')
            .setLabel('Sonraki ▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 2)
        );

      // Interaction'ı hızlıca acknowledge et
      try {
        if (!i.deferred && !i.replied) {
          await i.deferUpdate();
        }
      } catch (deferErr) {
        // Defer başarısız olabilir; yine de mesaj edit dene
      }

      // Interaction token yerine mesajı düzenle (daha güvenilir)
      try {
        await i.message.edit({
          embeds: [pages[currentPage - 1]],
          components: [newRow]
        });
      } catch (error) {
        console.log('Stats sayfa mesajı düzenlenemedi:', error);
      }
    });

    collector.on('end', async () => {
      // Collector süresi dolduğunda butonları devre dışı bırak
      const disabledRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('stats_prev')
            .setLabel('◀️ Önceki')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('stats_next')
            .setLabel('Sonraki ▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

      try {
        await response.edit({
          embeds: [pages[currentPage - 1]],
          components: [disabledRow]
        });
      } catch (error) {
        console.error('Stats sayfa güncelleme hatası:', error);
      }
    });

  } catch (error) {
    console.error('Stats komut hatası:', error);
    await interaction.reply({
      content: '❌ İstatistikler alınırken bir hata oluştu!',
      ephemeral: true
    });
  }
}

function createSatisfactionBar(stats: any): string {
  if (stats.total === 0) return 'Veri yok';

  const maxBarLength = 20;
  const total = stats.total;
  
  const bars = [
    { emoji: '😄', count: stats.very_satisfied, label: 'Çok Memnun' },
    { emoji: '🙂', count: stats.satisfied, label: 'Memnun' },
    { emoji: '😐', count: stats.neutral, label: 'Orta' },
    { emoji: '😕', count: stats.dissatisfied, label: 'Memnun Değil' },
    { emoji: '😠', count: stats.very_dissatisfied, label: 'Hiç Memnun Değil' }
  ];

  return bars.map(bar => {
    const percentage = total > 0 ? (bar.count / total) * 100 : 0;
    const barLength = Math.round((percentage / 100) * maxBarLength);
    const barString = '█'.repeat(barLength) + '░'.repeat(maxBarLength - barLength);
    return `${bar.emoji} ${bar.label}: ${barString} ${bar.count} (${Math.round(percentage)}%)`;
  }).join('\n');
} 