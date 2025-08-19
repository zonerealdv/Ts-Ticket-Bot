import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Komutlar ve kullanım bilgileri');

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('📖 Yardım')
      .setColor(global.config.colors.primary)
      .addFields([
        {
          name: '🛠️ Yönetim',
          value: '`/setup` — ticket paneli kurulum\n`/config set|view|test` — ayar yönetimi\n`/stats` — istatistikler',
          inline: false
        },
        {
          name: '🎫 Ticket',
          value: '`/ticket info` — ticket bilgisi\n`/ticket close` — ticket kapat',
          inline: false
        },
        {
          name: 'ℹ️ Diğer',
          value: '`/help` — bu menü',
          inline: false
        }
      ])
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Help komut hatası:', error);
    try {
      await interaction.reply({ content: '❌ Yardım gösterilemiyor!', ephemeral: true });
    } catch {}
  }
}


