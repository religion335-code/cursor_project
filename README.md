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

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 建立專案，啟用 **YouTube Data API v3**。
2. 建立 **Desktop** OAuth 用戶端，下載 JSON，存成專案根目錄的 `client_secret.json`（已在 `.gitignore`）。
3. 第一次上傳會開瀏覽器授權你的頻道：

```bash
crypto-studio upload output/ep-2026-08-30.mp4 content/episodes/ep-2026-08-30.yaml
```

這會上傳成**私人**影片。若要公開，必須你自己加 `--privacy public --allow-public`，且你必須已經看過成片。

沒有 `client_secret.json` 時，指令會拒絕執行，避免誤把稿件丟到錯誤帳號。

## 頻道建議（不要做成帶單頻道）

固定單元比每天追漲跌更耐看：

1. **日曆**：法案表決、FOMC、ETF 資金是流入還是流出  
2. **事實**：只引用來源，不發明內線  
3. **這代表／不代表**：拆開「合規變好」與「價格必漲」  
4. **風險**：槓桿、假客服、把生活費拿去賭  

禁止出現在稿件裡的話：保證獲利、穩賺、必漲、跟單、內線、現在不買就來不及。檢查器會擋下來。

角色設定見 `content/host.yaml`，立繪在 `assets/guaba.webp`。片頭固定：「這裡是時局筆記，我是呱霸。」

## 第一集

`content/episodes/ep-2026-08-30.yaml` 已寫好 2026-08-30 的時局稿：CLARITY 尚未成法、ETF 有進有出、Warsh 鷹派發言後利率敘事壓過法案敘事。渲染後請先自己看一遍再決定是否上傳。
