import { 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';

export class CommandManager {
  private commands: Map<string, any> = new Map();

  constructor() {
    this.loadCommands();
  }

  private async loadCommands(): Promise<void> {
    const commandsPath = path.join(__dirname, '../commands');
    
    try {
      const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
      
      for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        this.commands.set(command.data.name, command);
      }
      
      console.log(`✅ ${commandFiles.length} komut yüklendi`);
    } catch (error) {
      console.error('Komutlar yüklenemedi:', error);
    }
  }

  async registerCommands(): Promise<void> {
    try {
      const rest = new REST({ version: '10' }).setToken(global.config.bot.token);
      const commands = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());

      await rest.put(
        Routes.applicationGuildCommands(global.config.bot.clientId, global.config.bot.guildId),
        { body: commands }
      );

      console.log('✅ Slash komutları kaydedildi');
    } catch (error) {
      console.error('Komutlar kaydedilemedi:', error);
    }
  }

  async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
    const command = this.commands.get(interaction.commandName);
    
    if (!command) {
      await interaction.reply({ 
        content: '❌ Bu komut bulunamadı!', 
        ephemeral: true 
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Komut hatası ${interaction.commandName}:`, error);
      
      const errorMessage = '❌ Komut çalıştırılırken bir hata oluştu!';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  getCommands(): Map<string, any> {
    return this.commands;
  }
} 