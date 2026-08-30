# 時局筆記 · 呱霸主持

自動產出**可人工檢查**的繁體中文加密時局影片與社群草稿。  
主持人是 **格林·呱霸**（藝名呱霸）：綠臉、白背心、球棒扛肩。節目叫時局筆記，他是片中主角，不是幣圈叫盤的網紅。

**不要叫他 Pepe／佩佩。** 那是別人的著作權角色。也不要用「棍少」——中文裡太接近神棍。

## 這個工具做得到、做不到

| 做得到 | 做不到（也不該做） |
|--------|-------------------|
| 抓價格與頭條、寫逐字稿、配音、產出 mp4 | 登入你的 Google 密碼、假裝是你本人 24 小時值日 |
| 產出 X / Telegram **草稿檔** | 自動在幣圈群組、留言區、別人頻道發文 |
| 在你完成 OAuth 後，上傳成 **私人** 影片 | 未經檢查就公開上架、喊單、保證獲利 |
| 每集強制免責聲明與「禁止話術」檢查 | 把監管新聞包裝成進場訊號 |

YouTube 與各地廣告、金融規範都要求：**合成媒體要標示**，投資內容不能暗示穩賺。本專案把上傳預設鎖在 `private`。你看過畫面、核對來源、確認沒有喊單之後，才在 YouTube 後台改成公開。

若要讓「每天自動跑」，需要你自己的電腦或排程器執行 `crypto-studio pack`，並把 Google OAuth 檔放在本機。這個雲端任務結束後，我無法繼續登入你的頻道代操。

## 安裝

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp config.example.yaml config.yaml
```

需要系統已安裝 `ffmpeg`、`ffprobe`，以及中文字型（Debian/Ubuntu 可用文泉驛微米黑）。

## 每日流程

```bash
# 1. 抓行情與頭條
crypto-studio research

# 2. 編成一集 YAML（可先打開 content/episodes/ep-YYYY-MM-DD.yaml 改稿）
crypto-studio draft --refresh

# 3. 渲染 16:9 影片
crypto-studio render content/episodes/ep-2026-08-30.yaml

# 或一步做完（仍會先寫 YAML，建議渲染前先讀稿）
crypto-studio pack
```

輸出：

- `output/ep-….mp4` 影片
- `output/ep-…-preview.png` 封面靜幀
- `content/social/ep-…-x.txt`、`ep-…-telegram.txt` 社群草稿

直式 Shorts：

```bash
crypto-studio render content/episodes/ep-2026-08-30.yaml --aspect 9:16
```

## 上傳 YouTube（可選，預設私人）

YouTube Data API v3 啟用之後，還要做 **Google 驗證平台** 和 **電腦版 OAuth 用戶端**。這兩步不是搜尋「desktop Oauth」，而是在 [Google Auth Platform 總覽](https://console.cloud.google.com/auth/overview) 操作。

### 1. 點「開始」（設定同意畫面）

若看到「尚未設定 Google 驗證平台」，按藍色 **開始**：

1. **應用程式資訊：** 應用程式名稱填 `時局筆記`；使用者支援電子郵件選你的 Gmail。
2. **目標對象：** 選 **外部**（個人 Gmail 沒有「內部」）。
3. **聯絡資料：** 再填一次你的 Gmail。
4. 勾選同意、**建立**。

然後到左側 **目標對象 → 測試使用者 → 新增**，加入**管理這個品牌頻道的那封 Gmail**。測試中的應用只有這些人能授權。

左側 **資料存取權 → 新增範圍**，搜尋並勾選：

- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube.readonly`

儲存。未通過 Google 驗證前，授權畫面會寫「Google 尚未驗證這個應用程式」，這是正常的。

### 2. 建立「電腦版應用程式」用戶端

1. 左側按 **用戶端** → **建立用戶端**。
2. 應用程式類型選 **電腦版應用程式**（Desktop app）。不要選網頁應用程式，也不要建立 API 金鑰。
3. 名稱填 `時局筆記 desktop` → **建立**。
4. 按 **下載 JSON**，把檔案重新命名成 `client_secret.json`，放到本專案根目錄（已在 `.gitignore`，不要貼到聊天室）。

### 3. 授權品牌頻道（只授權，不上傳）

Google 授權做一次即可。之後**每一支影片仍要你點頭**才會上傳，`pack` 只產片、不會上架。

```bash
crypto-studio auth
```

把印出的網址在瀏覽器打開，選 **品牌頻道**。授權後會跳到打不開的 `localhost` 頁面：把網址列整段複製回來：

```bash
crypto-studio auth --redirect-url "http://localhost:8080/?code=..."
```

確認印出的頻道名稱是時局筆記。上傳某一集時必須帶同意旗標：

```bash
crypto-studio upload output/ep-2026-08-30.mp4 content/episodes/ep-2026-08-30.yaml --i-approve-upload
```

沒有 `--i-approve-upload` 會直接拒絕。公開上架還要再加 `--privacy public --allow-public`。

## 品牌頻道怎麼命名

這是 Google **品牌帳戶**（YouTube Brand Channel），和個人信箱是分開的。建議：

| 位置 | 填什麼 | 在哪改 |
|------|--------|--------|
| 品牌帳戶姓名 | 姓 `格林`、名 `呱霸` | [Google 帳戶 → 個人資料](https://myaccount.google.com/)（先切到品牌帳戶） |
| YouTube 頻道名稱 | `時局筆記` | [YouTube 工作室 → 自訂設定 → 基本資料](https://studio.youtube.com/) |
| 頭像 | `assets/guaba.webp` | 同一頁上傳 |
| 頻道代號 | `@guaba` 或 `@shiju-guaba`（英數） | 工作室 → 自訂設定 |

請不要把帶 `rapt=` 的 Google 連結傳出來，那是登入憑證。

## 頻道建議（不要做成帶單頻道）

固定單元比每天追漲跌更耐看：

1. **日曆**：法案表決、FOMC、ETF 資金是流入還是流出  
2. **事實**：只引用來源，不發明內線  
3. **這代表／不代表**：拆開「合規變好」與「價格必漲」  
4. **風險**：槓桿、假客服、把生活費拿去賭  

禁止出現在稿件裡的話：保證獲利、穩賺、必漲、跟單、內線、現在不買就來不及。檢查器會擋下來。

角色設定見 `content/host.yaml`，立繪在 `assets/guaba.webp`。聲音檔請放到 `assets/guaba-voice.mp4`（Windows OneDrive 路徑雲端讀不到，需上傳）。

## 呱霸入門（01 BTC → 02 ETH → 03 SOL）

```bash
crypto-studio series
```

- `content/episodes/ep-01-btc.yaml` 比特幣是什麼
- `content/episodes/ep-02-eth.yaml` 以太坊是什麼
- `content/episodes/ep-03-sol.yaml` 索拉納是什麼

開場若有 `assets/guaba-voice.mp4`，會先播放呱霸自己的聲音。沒有檔案時，旁白暫用系統語音，並在終端機提示缺少聲音檔。上傳仍須你同意，不會自動上架。

## 時局樣本

`content/episodes/ep-2026-08-30.yaml` 是 2026-08-30 的時局稿，不是入門第一集。
