export const STRINGS = {
  "zh-TW": {
    htmlLang: "zh-Hant",
    title: "Grok Bot 官方下載指引",
    brandKicker: "非官方整理 · 只連到官方來源",
    brandName: "Grok Bot 下載",
    langLabel: "English",
    heroEyebrow: "SpaceXAI · Grok Bot",
    heroTitle: "從官方管道下載 Grok Bot",
    heroLead:
      "這不是 xAI 官網。這裡幫你辨識裝置、核對資格，然後把你送到 x.ai、App Store 或 Google Play 的官方頁面。本站不托管任何安裝檔。",
    selectedLabel: "目前選擇",
    detectedLabel: "偵測到的裝置",
    detectedUnknown: "無法自動判斷裝置，請手動選一個平台。",
    ipadNote:
      "iPad 目前不支援 Grok Bot。請改用 iPhone（iOS 18+）或桌面版。",
    macosArchNote:
      "瀏覽器沒有回報晶片種類。Apple 晶片較常見；若是 Intel Mac，請改選 Intel 版本。",
    confidenceHigh: "自動偵測",
    confidenceMedium: "大致判斷，請再確認",
    officialCta: "前往官方下載",
    copyLink: "複製官方連結",
    copied: "已複製",
    otherPlatforms: "其他平台",
    moreLinux: "Linux 請在官網選 More downloads，下載 .deb、.rpm 或 AppImage。",
    eligibilityTitle: "你有沒有資格？",
    eligibilityLead:
      "Grok Bot 綁在 Cursor 帳號上。官方文件目前列出這些方案（含每週用量；可再加購超量）。",
    eligibilityHint: "可複選。這只是核對，不會阻擋下載。",
    eligibilityYes: "依官方清單，你勾到的方案包含 Grok Bot。",
    eligibilityNo: "尚未勾到符合方案。仍可打開官方頁確認最新資格。",
    checkPricing: "查看 Cursor 方案",
    privacyNote:
      "Grok Bot 需要雲端資料儲存。Cursor 舊版 Privacy Mode 必須先改成支援的資料設定，才能啟動。",
    stepsTitle: "安裝步驟",
    firstTaskTitle: "裝好後的第一件事",
    firstTaskLead:
      "用 Cursor 帳號登入，建立第一個 Bot，再丟一個五分鐘就能驗收的任務。",
    task1Title: "五分鐘驗收（不用登外部工具）",
    task1Body:
      "把這份文件整理成五點摘要。另開一區列出每個日期、決策與未解問題，並標出頁碼或章節。不要改原始檔。",
    task2Title: "進你常用的工具",
    task2Body:
      "打開我們的分析儀表板，比較本週與前四週的新用戶啟動。找出最大的步驟落差，並起草一份附圖表連結的調查計畫。不要改任何儀表板。需要登入就問我。",
    copyTask: "複製任務",
    faqTitle: "常見問題",
    disclaimer:
      "本頁由 cursor_project 整理，不是 xAI、SpaceXAI 或 Cursor 的官方網站。下載、安裝與登入請只使用上方官方連結。",
    footerDocs: "官方說明",
    footerFaq: "官方 FAQ",
    footerIntro: "產品介紹",
    platforms: {
      "macos-apple": {
        name: "macOS（Apple 晶片）",
        cta: "到 x.ai/bot 下載 Apple silicon",
        check: "蘋果選單 → 關於這台 Mac。有「晶片」欄就是 Apple 晶片。",
        steps: [
          "打開官方下載頁，選 Apple silicon。",
          "開啟下載的磁碟映像。",
          "把 Grok Bot 拖進「應用程式」。",
          "開啟 Grok Bot。若 macOS 詢問，選「打開」。",
          "選 Get started，用 Cursor 帳號在瀏覽器完成登入。",
        ],
      },
      "macos-intel": {
        name: "macOS（Intel）",
        cta: "到 x.ai/bot 下載 Intel",
        check: "蘋果選單 → 關於這台 Mac。有「處理器」欄就是 Intel。",
        steps: [
          "打開官方下載頁，選 Intel。",
          "開啟下載的磁碟映像。",
          "把 Grok Bot 拖進「應用程式」。",
          "開啟 Grok Bot。若 macOS 詢問，選「打開」。",
          "選 Get started，用 Cursor 帳號在瀏覽器完成登入。",
        ],
      },
      "windows-x64": {
        name: "Windows（x64）",
        cta: "到 x.ai/bot 下載 Windows x64",
        check: "設定 → 系統 → 關於 → 系統類型。多數電腦是 x64。",
        steps: [
          "打開官方下載頁，選 x64。",
          "執行安裝程式。",
          "從開始功能表開啟 Grok Bot。",
          "選 Get started，用 Cursor 帳號在瀏覽器完成登入。",
        ],
      },
      "windows-arm64": {
        name: "Windows（Arm64）",
        cta: "到 x.ai/bot 下載 Windows Arm64",
        check: "設定 → 系統 → 關於 → 系統類型。看到 ARM 就選 Arm64。",
        steps: [
          "打開官方下載頁，選 Arm64。",
          "執行安裝程式。",
          "從開始功能表開啟 Grok Bot。",
          "選 Get started，用 Cursor 帳號在瀏覽器完成登入。",
        ],
      },
      "linux-x64": {
        name: "Linux（x64）",
        cta: "到 x.ai/bot → More downloads",
        check: "終端機執行 uname -m。x86_64 就是 x64。",
        steps: [
          "打開 x.ai/bot，點 More downloads。",
          "依發行版選 .deb（Debian／Ubuntu）、.rpm（Fedora／RHEL）或 AppImage。",
          "用套件管理員安裝 .deb／.rpm，或把 AppImage 設成可執行後執行。",
          "從應用程式啟動器開啟 Grok Bot。",
          "選 Get started，用 Cursor 帳號完成登入。",
        ],
      },
      "linux-arm64": {
        name: "Linux（Arm64）",
        cta: "到 x.ai/bot → More downloads",
        check: "終端機執行 uname -m。aarch64 就是 Arm64。",
        steps: [
          "打開 x.ai/bot，點 More downloads。",
          "選 Arm64 的 .deb、.rpm 或 AppImage。",
          "安裝套件或執行 AppImage。",
          "從應用程式啟動器開啟 Grok Bot。",
          "選 Get started，用 Cursor 帳號完成登入。",
        ],
      },
      ios: {
        name: "iPhone（iOS 18+）",
        cta: "到 App Store 下載 Grok Bot",
        check: "僅 iPhone。需要 iOS 18 或更新版本。iPad 目前不支援。",
        steps: [
          "在 iPhone 打開官方 App Store 頁面。",
          "安裝「Grok Bot」（發行商 Anysphere）。",
          "用同一個 Cursor 帳號登入。",
          "桌面與手機上的 Bot 與對話會同步。",
        ],
      },
      android: {
        name: "Android 9+",
        cta: "到 Google Play 下載 Grok Bot",
        check: "套件名稱是 ai.x.grok.bot，不是一般的「Grok AI」聊天 App。",
        steps: [
          "打開官方 Google Play 頁面。",
          "安裝「Grok Bot」（套件 ai.x.grok.bot）。",
          "用 Cursor 帳號登入。",
          "手機鎖定後，Bot 仍會在雲端電腦上繼續工作。",
        ],
      },
    },
    faq: [
      {
        q: "Grok Bot 跟一般 AI 助理差在哪？",
        a: "Bot 有一台常駐雲端電腦，能登入你的 App 與網站、在背景把工作做完，只有需要核准時才回來找你。",
      },
      {
        q: "關筆電它還會繼續做嗎？",
        a: "會。工作跑在雲端電腦上，關掉 App、筆電或手機都不會停掉背景任務或例行工作。",
      },
      {
        q: "多個 Bot 會共用一台電腦嗎？",
        a: "會。同一個帳號的所有 Bot 共用一台電腦、檔案與登入工作階段。不要把不同 Bot 當成安全隔離。",
      },
      {
        q: "Linux 桌面有正式版嗎？",
        a: "有。官方每個穩定版都會出 x64／Arm64 的 .deb、.rpm 與 AppImage，在 x.ai/bot 的 More downloads。",
      },
      {
        q: "為什麼不能從這個網站直接下載安裝檔？",
        a: "第三方托管安裝檔有被掉包的風險。請只從 x.ai、App Store 與 Google Play 安裝。",
      },
    ],
  },
  en: {
    htmlLang: "en",
    title: "Grok Bot official download guide",
    brandKicker: "Unofficial guide · official links only",
    brandName: "Grok Bot download",
    langLabel: "中文",
    heroEyebrow: "SpaceXAI · Grok Bot",
    heroTitle: "Download Grok Bot from the official sources",
    heroLead:
      "This is not the xAI website. It detects your device, checks plan eligibility, then sends you to x.ai, the App Store, or Google Play. No installers are hosted here.",
    selectedLabel: "Selected",
    detectedLabel: "Detected device",
    detectedUnknown: "Could not detect a device. Pick a platform below.",
    ipadNote:
      "iPad is not supported. Use an iPhone (iOS 18+) or the desktop app.",
    macosArchNote:
      "The browser did not report chip type. Apple silicon is the usual default; switch to Intel if that is your Mac.",
    confidenceHigh: "Auto-detected",
    confidenceMedium: "Best guess — confirm below",
    officialCta: "Open official download",
    copyLink: "Copy official link",
    copied: "Copied",
    otherPlatforms: "Other platforms",
    moreLinux:
      "On Linux, use More downloads on the official site for .deb, .rpm, or AppImage.",
    eligibilityTitle: "Do you have access?",
    eligibilityLead:
      "Grok Bot signs in with your Cursor account. Current official docs list these plans (weekly included usage; extra usage is metered).",
    eligibilityHint: "Multi-select. This is a check only — it never blocks download.",
    eligibilityYes: "A plan you checked is on the official access list.",
    eligibilityNo:
      "No matching plan selected yet. You can still open the official page to confirm.",
    checkPricing: "Cursor pricing",
    privacyNote:
      "Grok Bot requires cloud data storage. Cursor Legacy Privacy Mode must be changed to a supported setting first.",
    stepsTitle: "Install steps",
    firstTaskTitle: "First task after install",
    firstTaskLead:
      "Sign in with Cursor, create your first Bot, then give it a five-minute task you can review.",
    task1Title: "Five-minute check (no extra logins)",
    task1Body:
      "Summarize this document in five bullets. List every date, decision, and open question in a separate section. Cite the page or section for each item. Do not change the source file.",
    task2Title: "Inside one of your tools",
    task2Body:
      "Open our analytics dashboard and compare new-user activation for this week with the previous four weeks. Identify the largest step-level change and draft a short investigation plan with links to the relevant charts. Do not change any dashboards. Ask me to sign in if needed.",
    copyTask: "Copy task",
    faqTitle: "FAQ",
    disclaimer:
      "This page is part of cursor_project. It is not an official xAI, SpaceXAI, or Cursor site. Download, install, and sign in only through the official links above.",
    footerDocs: "Official docs",
    footerFaq: "Official FAQ",
    footerIntro: "Product intro",
    platforms: {
      "macos-apple": {
        name: "macOS (Apple silicon)",
        cta: "Download Apple silicon on x.ai/bot",
        check: "Apple menu → About This Mac. A Chip field means Apple silicon.",
        steps: [
          "Open the official downloads page and choose Apple silicon.",
          "Open the downloaded disk image.",
          "Drag Grok Bot to Applications.",
          "Open Grok Bot. Choose Open if macOS asks.",
          "Choose Get started and finish Cursor sign-in in the browser.",
        ],
      },
      "macos-intel": {
        name: "macOS (Intel)",
        cta: "Download Intel on x.ai/bot",
        check: "Apple menu → About This Mac. A Processor field means Intel.",
        steps: [
          "Open the official downloads page and choose Intel.",
          "Open the downloaded disk image.",
          "Drag Grok Bot to Applications.",
          "Open Grok Bot. Choose Open if macOS asks.",
          "Choose Get started and finish Cursor sign-in in the browser.",
        ],
      },
      "windows-x64": {
        name: "Windows (x64)",
        cta: "Download Windows x64 on x.ai/bot",
        check: "Settings → System → About → System type. Most PCs are x64.",
        steps: [
          "Open the official downloads page and choose x64.",
          "Run the installer.",
          "Open Grok Bot from the Start menu.",
          "Choose Get started and finish Cursor sign-in in the browser.",
        ],
      },
      "windows-arm64": {
        name: "Windows (Arm64)",
        cta: "Download Windows Arm64 on x.ai/bot",
        check: "Settings → System → About → System type. Choose Arm64 if you see ARM.",
        steps: [
          "Open the official downloads page and choose Arm64.",
          "Run the installer.",
          "Open Grok Bot from the Start menu.",
          "Choose Get started and finish Cursor sign-in in the browser.",
        ],
      },
      "linux-x64": {
        name: "Linux (x64)",
        cta: "Open x.ai/bot → More downloads",
        check: "In a terminal, uname -m. x86_64 means x64.",
        steps: [
          "Open x.ai/bot and choose More downloads.",
          "Pick .deb (Debian/Ubuntu), .rpm (Fedora/RHEL), or AppImage.",
          "Install the package, or make the AppImage executable and run it.",
          "Open Grok Bot from your application launcher.",
          "Choose Get started and sign in with your Cursor account.",
        ],
      },
      "linux-arm64": {
        name: "Linux (Arm64)",
        cta: "Open x.ai/bot → More downloads",
        check: "In a terminal, uname -m. aarch64 means Arm64.",
        steps: [
          "Open x.ai/bot and choose More downloads.",
          "Pick the Arm64 .deb, .rpm, or AppImage.",
          "Install the package or run the AppImage.",
          "Open Grok Bot from your application launcher.",
          "Choose Get started and sign in with your Cursor account.",
        ],
      },
      ios: {
        name: "iPhone (iOS 18+)",
        cta: "Get Grok Bot on the App Store",
        check: "iPhone only. Requires iOS 18 or later. iPad is not supported.",
        steps: [
          "Open the official App Store listing on an iPhone.",
          "Install Grok Bot (publisher: Anysphere).",
          "Sign in with the same Cursor account.",
          "Bots and threads sync with the desktop app.",
        ],
      },
      android: {
        name: "Android 9+",
        cta: "Get Grok Bot on Google Play",
        check: "Package id ai.x.grok.bot — not the consumer Grok AI chat app.",
        steps: [
          "Open the official Google Play listing.",
          "Install Grok Bot (package ai.x.grok.bot).",
          "Sign in with your Cursor account.",
          "Bots keep working on the cloud computer after you lock the phone.",
        ],
      },
    },
    faq: [
      {
        q: "How is Grok Bot different from a chat assistant?",
        a: "Each account gets a persistent cloud computer. Bots sign into your apps and websites, finish work in the background, and only return when they need approval.",
      },
      {
        q: "Does it keep working when my laptop is closed?",
        a: "Yes. Work runs on the cloud computer. Closing the app, laptop, or phone does not stop a background turn or routine.",
      },
      {
        q: "Do my Bots share one computer?",
        a: "Yes. Every Bot on your account shares one computer, files, and browser sessions. Do not treat separate Bots as a security boundary.",
      },
      {
        q: "Is there a Linux desktop app?",
        a: "Yes. Stable releases publish x64 and Arm64 .deb, .rpm, and AppImage builds under More downloads on x.ai/bot.",
      },
      {
        q: "Why can't I download the installer from this page?",
        a: "Third-party hosted installers can be swapped. Install only from x.ai, the App Store, and Google Play.",
      },
    ],
  },
};
