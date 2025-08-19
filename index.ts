import { Client, GatewayIntentBits, Collection, Events, ActivityType } from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { DatabaseManager } from './src/utils/DatabaseManager';
import { Logger } from './src/utils/Logger';
import { TicketManager } from './src/managers/TicketManager';
import { TranscriptManager } from './src/managers/TranscriptManager';
import { CommandManager } from './src/managers/CommandManager';
import { EventManager } from './src/managers/EventManager';

// Config dosyasını yükle
const config = JSON.parse(readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// Bot client'ını oluştur
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Ready event - Bot hazır olduğunda çalışır
client.on(Events.ClientReady, () => {
  console.log(`${client.user?.tag} olarak giriş yapıldı!`);
  
  // Bot durumunu ayarla
  client.user?.setActivity({
    name: '🎫 Ticket Sistemi',
    type: ActivityType.Watching
  });
  
  console.log('Bot durumu ayarland');
});

// Global değişkenler
declare global {
  var config: any;
  var client: Client;
  var database: DatabaseManager;
  var logger: Logger;
  var ticketManager: TicketManager;
  var transcriptManager: TranscriptManager;
  var commandManager: CommandManager;
}

// Global değişkenleri ayarla
global.config = config;
global.client = client;
global.database = new DatabaseManager();
global.logger = new Logger();
global.ticketManager = new TicketManager();
global.transcriptManager = new TranscriptManager();
global.commandManager = new CommandManager();

// Event manager'ı başlat
new EventManager();

// Bot başlat
client.login(config.bot.token); 