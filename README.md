# Grok Bot 官方下載指引

這不是 xAI 官網。這個靜態頁只做三件事：辨識你的裝置、核對官方文件列出的方案，然後把你送到 **官方下載頁**。

本倉庫**不托管** `.dmg`、`.exe`、`.deb` 或任何安裝檔。

## 官方下載（請只從這裡裝）

| 平台 | 官方位置 |
| --- | --- |
| macOS（Apple 晶片／Intel） | [x.ai/bot](https://x.ai/bot) |
| Windows（x64／Arm64） | [x.ai/bot](https://x.ai/bot) |
| Linux（x64／Arm64，`.deb` / `.rpm` / AppImage） | [x.ai/bot](https://x.ai/bot) → More downloads |
| iPhone（iOS 18+） | [App Store · Grok Bot](https://apps.apple.com/app/grok-bot/id6794501026) |
| Android 9+ | [Google Play · Grok Bot](https://play.google.com/store/apps/details?id=ai.x.grok.bot) |

安裝步驟見 [Get started](https://docs.x.ai/grok-bot/get-started)。iPad 目前不支援。

## 資格（以官方文件為準）

登入用 **Cursor 帳號**。目前 [官方 FAQ](https://docs.x.ai/grok-bot/faq) 列出：

- SuperGrok Plus、SuperGrok Heavy
- Cursor Pro+、Cursor Ultra
- Cursor Teams Standard、Cursor Teams Premium

Grok Bot 需要雲端資料儲存；Cursor **Legacy Privacy Mode** 必須先改成支援的設定。方案細節以 [Cursor pricing](https://cursor.com/pricing) 與 [x.ai/bot](https://x.ai/bot) 為準。

## 本機預覽

```bash
npm test
npm start
```

瀏覽器打開 http://localhost:4173
