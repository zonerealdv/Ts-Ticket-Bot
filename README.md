### Özellikler

– `Ticket paneli: `/setup` ile butonlu panel`
– `Ticket açma (modal): sebep girişi, doğrulama`
– `Tek açık ticket: mevcut ticket kapanmadan yenisi yok`
– `Memnuniyet sistemi: seçim menüsü, menü kaldırma`
– `Teşekkür + otomatik kapatma: zamanlayıcıyla silme`
– `Üye yönetimi: kanala kullanıcı ekle/çıkar (modal)`
– `Transcript ve log: arşiv ve olay kaydı`
– `İstatistikler (sayfalı): özet ve memnuniyet dağılımı`
– `Slash komutları: `/help`,`/setup`, `/stats`, `/ticket ...``
– `JSON veritabanı: kalıcı saklama`
– `Ayarlar: renk/kanal/rol/kategori/limit`

### Kurulum

- `npm install`
- `config.json - bot bilgilerini doldur`
- `npm run dev`

### Yapılandırma

- Komutla: `/config set` ile ayarla
  - `type:logChannel` → `log_channel:#kanal`
  - `type:transcriptChannel` → `transcript_channel:#kanal`
  - `type:staffRole` → `staff_role:@rol`
  - `type:ticketCategory` → `ticket_category:#kategori`
  - `type:maxTickets` → `max_tickets:1-10`
  - `type:autoCloseHours` → `auto_close_hours:1-168`
- Manuel: `config.json` düzenle (kısa)
  - `bot.token`, `bot.clientId`, `bot.guildId`
  - `channels.logChannelId`, `channels.transcriptChannelId`
  - `roles.staffRoleId`, `ticket.categoryId`
  - `ticket.maxTicketsPerUser`, `ticket.autoCloseAfterHours`
  - Değişikliklerden sonra botu yeniden başlat


