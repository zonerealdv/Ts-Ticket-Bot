# 🎫 Discord Ticket Bot

**TypeScript ile geliştirilmiş profesyonel Discord ticket sistemi**

[![Discord.js](https://img.shields.io/badge/discord.js-v14.14.1-blue.svg)](https://discord.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Kurulum](#-kurulum)
- [Yapılandırma](#-yapılandırma)
- [Kullanım](#-kullanım)
- [Komutlar](#-komutlar)
- [Proje Yapısı](#-proje-yapısı)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Modern Discord.js v14** desteği
- **TypeScript** ile tip güvenli geliştirme
- **Slash Commands** ile modern komut sistemi
- **Modal Forms** ile detaylı ticket oluşturma
- **Button Interactions** ile kolay kullanım
- **Select Menus** ile memnunluk değerlendirmesi

### 🛠️ Ticket Yönetimi
- ✅ Otomatik ticket kanalı oluşturma
- ✅ Kullanıcı bazlı izin yönetimi
- ✅ Maksimum ticket sayısı kontrolü
- ✅ Ticket sebep sistemi
- ✅ Üye ekleme/kaldırma sistemi
- ✅ Otomatik ticket kapatma

### 📊 İstatistik ve Raporlama
- 📈 Detaylı ticket istatistikleri
- 😊 Memnunluk değerlendirme sistemi
- 📄 Otomatik transcript oluşturma
- 📝 Kapsamlı log sistemi
- 📊 Grafik destekli raporlar

### 🔧 Yönetim Özellikleri
- ⚙️ Dinamik yapılandırma sistemi
- 🧪 Ayar test sistemi
- 🎨 Özelleştirilebilir renkler
- 📁 Kategori bazlı organizasyon
- 🔒 Rol bazlı yetkilendirme

## 🚀 Kurulum

### Gereksinimler
- **Node.js** 20.0.0 veya üzeri
- **npm** veya **yarn** paket yöneticisi
- **Discord Bot Token**
- **Discord Sunucu** (Guild) yönetici yetkisi

### Adım 1: Projeyi İndirin
```bash
git clone https://github.com/zonerealdv/discord-ticket-bot.git
cd discord-ticket-bot
```

### Adım 2: Bağımlılıkları Yükleyin
```bash
npm install
# veya
yarn install
```

### Adım 3: Yapılandırma
[`config.json`](config.json) dosyasını düzenleyin:

```json
{
  "bot": {
    "token": "BOT_TOKEN_BURAYA",
    "clientId": "BOT_CLIENT_ID",
    "guildId": "SUNUCU_ID"
  },
  "channels": {
    "logChannelId": "LOG_KANAL_ID",
    "transcriptChannelId": "TRANSCRIPT_KANAL_ID"
  },
  "roles": {
    "staffRoleId": "YETKILI_ROL_ID"
  },
  "ticket": {
    "categoryId": "TICKET_KATEGORI_ID",
    "maxTicketsPerUser": 5,
    "autoCloseAfterHours": 100
  }
}
```

### Adım 4: Projeyi Derleyin ve Çalıştırın
```bash
# Geliştirme modu
npm run dev

# Üretim için derleme
npm run build
npm start
```

## ⚙️ Yapılandırma

### Bot Ayarları
| Ayar | Açıklama | Gerekli |
|------|----------|---------|
| `bot.token` | Discord bot token | ✅ |
| `bot.clientId` | Bot client ID | ✅ |
| `bot.guildId` | Sunucu ID | ✅ |

### Kanal Ayarları
| Ayar | Açıklama | Gerekli |
|------|----------|---------|
| `channels.logChannelId` | Log mesajları kanalı | ✅ |
| `channels.transcriptChannelId` | Transcript dosyaları kanalı | ✅ |

### Ticket Ayarları
| Ayar | Açıklama | Varsayılan |
|------|----------|------------|
| `ticket.maxTicketsPerUser` | Kullanıcı başına max ticket | 5 |
| `ticket.autoCloseAfterHours` | Otomatik kapatma süresi | 100 |

### Renk Ayarları
```json
{
  "colors": {
    "primary": "#5865F2",
    "success": "#57F287",
    "error": "#ED4245",
    "warning": "#FEE75C"
  }
}
```

## 📖 Kullanım

### 1. Bot Kurulumu
```bash
/setup
```
Ticket panelini kurar ve gerekli ayarları kontrol eder.

### 2. Ayar Yapılandırması
```bash
/config set type:logChannel log_channel:#log-kanalı
/config set type:staffRole staff_role:@Yetkili
/config set type:ticketCategory ticket_category:Tickets
```

### 3. Ticket Oluşturma
Kullanıcılar ticket panelindeki **"Ticket Oluştur"** butonuna tıklayarak:
1. Modal form açılır
2. Ticket sebebini yazarlar
3. Otomatik olarak özel kanal oluşturulur

### 4. Ticket Yönetimi
- **Ticket Kapat**: Memnunluk değerlendirmesi ile kapatma
- **Üye Ekle/Kaldır**: Kanala ek kullanıcı ekleme
- **Transcript**: Otomatik konuşma kaydı

## 🎮 Komutlar

### 👑 Yönetici Komutları
| Komut | Açıklama | Yetki |
|-------|----------|-------|
| `/setup` | Ticket paneli kurulumu | Administrator |
| `/config set` | Ayar değiştirme | Administrator |
| `/config view` | Mevcut ayarları görüntüleme | Administrator |
| `/config test` | Ayarları test etme | Administrator |
| `/stats` | Bot istatistikleri | Manage Guild |

### 🎫 Ticket Komutları
| Komut | Açıklama | Yetki |
|-------|----------|-------|
| `/ticket info` | Ticket bilgilerini göster | Manage Channels |
| `/ticket close` | Ticket'ı kapat | Manage Channels |

### ℹ️ Genel Komutlar
| Komut | Açıklama | Yetki |
|-------|----------|-------|
| `/help` | Yardım menüsü | Herkes |

## 🏗️ Proje Yapısı

```
discord-ticket-bot/
├── 📁 src/
│   ├── 📁 commands/          # Slash komutları
│   │   ├── config.ts         # Yapılandırma komutları
│   │   ├── help.ts           # Yardım komutu
│   │   ├── setup.ts          # Kurulum komutu
│   │   ├── stats.ts          # İstatistik komutu
│   │   └── ticket.ts         # Ticket komutları
│   ├── 📁 managers/          # Yönetici sınıfları
│   │   ├── CommandManager.ts # Komut yöneticisi
│   │   ├── EventManager.ts   # Event yöneticisi
│   │   ├── TicketManager.ts  # Ticket yöneticisi
│   │   └── TranscriptManager.ts # Transcript yöneticisi
│   └── 📁 utils/             # Yardımcı araçlar
│       ├── DatabaseManager.ts # Veritabanı yöneticisi
│       └── Logger.ts         # Log sistemi
├── 📄 config.json           # Bot yapılandırması
├── 📄 database.json         # JSON veritabanı
├── 📄 index.ts              # Ana giriş dosyası
├── 📄 package.json          # Proje bağımlılıkları
├── 📄 tsconfig.json         # TypeScript yapılandırması
└── 📄 README.md             # Bu dosya
```

### 🔧 Temel Sınıflar

#### [`TicketManager`](src/managers/TicketManager.ts)
- Ticket oluşturma ve yönetimi
- Kullanıcı izin kontrolü
- Memnunluk değerlendirme sistemi

#### [`DatabaseManager`](src/utils/DatabaseManager.ts)
- JSON tabanlı veri saklama
- Ticket, transcript ve log yönetimi
- İstatistik hesaplamaları

#### [`EventManager`](src/managers/EventManager.ts)
- Discord event yönetimi
- Button, modal ve select menu işlemleri
- Mesaj dinleme sistemi

#### [`Logger`](src/utils/Logger.ts)
- Embed tabanlı log sistemi
- Transcript dosya yönetimi
- Renkli log kategorileri

## 📊 Veritabanı Yapısı

### Ticket Modeli
```typescript
interface Ticket {
  id: string;                    // Benzersiz ticket ID
  channelId: string;             // Discord kanal ID
  userId: string;                // Ticket açan kullanıcı ID
  reason?: string;               // Ticket açma sebebi
  createdAt: Date;               // Oluşturulma tarihi
  closedAt?: Date;               // Kapatılma tarihi
  closedBy?: string;             // Kapatan kullanıcı ID
  status: 'open' | 'closed';     // Ticket durumu
  messages: Message[];           // Ticket mesajları
  satisfaction?: SatisfactionLevel; // Memnunluk seviyesi
}
```

### Memnunluk Seviyeleri
- 😄 **Çok Memnun** (very_satisfied)
- 🙂 **Memnun** (satisfied)
- 😐 **Orta** (neutral)
- 😕 **Memnun Değil** (dissatisfied)
- 😠 **Hiç Memnun Değil** (very_dissatisfied)

## 🎨 Özelleştirme

### Renk Teması
[`config.json`](config.json) dosyasında renkleri özelleştirebilirsiniz:

```json
{
  "colors": {
    "primary": "#5865F2",    // Ana renk (mavi)
    "success": "#57F287",    // Başarı rengi (yeşil)
    "error": "#ED4245",      // Hata rengi (kırmızı)
    "warning": "#FEE75C"     // Uyarı rengi (sarı)
  }
}
```

### Embed Mesajları
Embed mesajlarını [`src/managers/TicketManager.ts`](src/managers/TicketManager.ts) dosyasından özelleştirebilirsiniz.

### Komut İzinleri
Komut izinlerini her komut dosyasında `.setDefaultMemberPermissions()` ile ayarlayabilirsiniz.

## 🔍 Sorun Giderme

### Yaygın Hatalar

#### Bot Yanıt Vermiyor
```bash
# Botun çevrimiçi olduğunu kontrol edin
# Token'ın doğru olduğunu kontrol edin
# Slash komutlarının kaydedildiğini kontrol edin
```

#### Ticket Oluşturulamıyor
```bash
# Kategori ID'sinin doğru olduğunu kontrol edin
# Bot izinlerini kontrol edin (Manage Channels)
# Yetkili rol ID'sinin doğru olduğunu kontrol edin
```

#### Log Mesajları Gönderilmiyor
```bash
# Log kanal ID'sinin doğru olduğunu kontrol edin
# Bot'un kanala mesaj gönderme izninin olduğunu kontrol edin
```

### Debug Modu
Geliştirme sırasında detaylı loglar için:

```bash
npm run dev
```

## 🤝 Katkıda Bulunma

1. **Fork** edin
2. **Feature branch** oluşturun (`git checkout -b feature/amazing-feature`)
3. **Commit** edin (`git commit -m 'Add amazing feature'`)
4. **Push** edin (`git push origin feature/amazing-feature`)
5. **Pull Request** açın

### Geliştirme Kuralları
- TypeScript tip güvenliğini koruyun
- ESLint kurallarına uyun
- Commit mesajlarını açıklayıcı yazın
- Yeni özellikler için testler ekleyin

## 📝 Changelog

### v1.0.0 (2024)
- ✅ İlk sürüm yayınlandı
- ✅ Temel ticket sistemi
- ✅ Memnunluk değerlendirme sistemi
- ✅ İstatistik sistemi
- ✅ Transcript sistemi

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## 👨‍💻 Geliştirici

**ZoneReal** tarafından geliştirilmiştir.

## ⚡ Destekçi

**YagmurSoftware**

---

## 🆘 Destek

Herhangi bir sorun yaşarsanız:

1. [Issues](https://github.com/yourusername/discord-ticket-bot/issues) bölümünde arama yapın
2. Yeni bir issue açın
3. Detaylı açıklama ve hata logları ekleyin

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

</div>
