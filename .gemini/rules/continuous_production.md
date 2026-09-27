# 持續製作指令與規範 (Continuous Production Permanent Memory)

當使用者提及「持續製作」或觸發持續開發流程時，必須嚴格執行以下規範：

## 1. 執行模式與工作週期
- **自主持續循環**：不主動終止任務，持續優化現有體驗或擴充 ClassDojo 經典功能，直到「五小時用量剩下 5%」或達到配額上限時方才安全收尾。
- **定時回報機制**：每 15 分鐘主動向使用者進行一次詳細進度報告（開發成果、視覺優化、雙端測試與部署狀況）。
- **四大專項 Agent 組織分工**：依據使用者指定架構，明確劃分為「功能組、外觀組、測試組、資安組」四大專責團隊協同作業。

---

## 2. 四大 Agent 專項組別職責規範

### 🧩 2.1 功能組 (Core Feature Team)
- **教育核心功能實裝與深耕**：以 ClassDojo 現代商業級標竿為參照，落實核心教學流程。
- **學生個人數位作品集 (Student Portfolios)**：學生端創作繳交（成果、反思、繪圖/標籤）、教師端批閱打分（花朵貼紙、點數獎勵、專業回饋、發布至班級日誌）、家長端成果展示牆與雙向讚賞。
- **小組合作蜂巢競賽看板 (Hive Groups & Competition)**：組別管理、成員入組、一鍵小組協作加分 (`awardHiveGroupPoint`)、班級即時競賽排行榜、大螢幕競賽投影模式。
- **操作便捷性與流程優化**：全域鍵盤快捷鍵（Esc 關閉、Enter 送出）、學生名單即時搜尋過濾、自動聚焦表單。

### 🎨 2.2 外觀組 (Aesthetics & UI Team)
- **徹底去除 AI 罐頭感與非專業 emoji**：嚴禁在重要操作按鈕、功能卡片、狀態標籤上隨意堆砌生硬的系統 emoji。
- **全面採用 FontAwesome 官方向量圖標庫**：優先自 [FontAwesome](https://fontawesome.com/search) 引入標準 SVG / 圖標（`fa-solid`, `fa-regular`）。
- **對齊 ClassDojo 商業級教育軟體美感**：現代簡潔風格、圓潤卡片層次、精緻微動效、優雅漸層、符合 WCAG AA 規範的高對比度色彩排版。
- **現成高品質開源素材原則**：盡量使用成熟開源資源與 Twemoji 規範向量小蜜蜂，杜絕粗糙塗鴉。

### 🧪 2.3 測試組 (QA & Testing Team)
- **多端實機嚴格測試**：每完成一個開發階段，必須從頭執行端到端實機測試，確保完全沒有任何 bug 或破版。
- **雙端視圖覆蓋**：嚴格涵蓋 **電腦端 (Desktop: 1280×800)** 與 **手機端 (Mobile: 393×852 觸控模擬)**。
- **規範測試帳號**：帳號 `antigravity` / 密碼 `123456`。
- **維護測試自動化與部署流程**：維護 `test_e2e_runner.cjs`、更新首頁 Changelog、自動推播至 GitHub main 並確認 GitHub Pages 部署綠燈上線。

### 🛡️ 2.4 資安組 (Security & Infrastructure Team)
- **密碼強加密與防洩防護**：使用者密碼全面採用 Web Crypto API **SHA-256 + Salt** 異步安全雜湊校驗，嚴禁明文比對與明文儲存；家長代碼與敏感授權資訊進行遮蔽與隔離傳輸，禁止主控台明文輸出。
- **全站 XSS 嚴密防護**：所有使用者輸入文字（學生姓名、日誌、留言、評語等）在渲染時一律強制經過 `escapeHTML` 安全消毒，禁止未經防護直接拼接 `innerHTML`。
- **資料庫讀寫頻率與尖峰控管 (Database Quota Guard)**：在 `firebase-config.js` 實施 400ms 寫入防抖 (Debounce) 與批量合流 (Batch Coalescing)，阻斷快速連續連點造成的 Firestore / 本機讀寫暴衝，確保資料庫配額安全。
- **儲存空間配置與動態防爆管理 (Storage Quota Manager)**：監控 LocalStorage 與 Cloud 空間佔用，對作品集大圖/手繪向量進行壓縮；當儲存空間接近 80% 警戒線時，自動觸發歷史舊流水號之無損滾動封存（LRU 策略），徹底杜絕 `QuotaExceededError` 引起的程式崩潰。
- **零資料更動原則**：絕不破壞、覆蓋既有使用者的正式班級、學生與作業資料結構。

---

## 3. 終端機執行限制與禁止指令清單 (Terminal Execution Policy & DenyList)
在所有對話、任務與自動化腳本中，嚴格遵守以下終端機執行限制：

```json
{
  "agent": {
    "terminalExecutionPolicy": "turbo",
    "denyList": [
      "rm -rf",
      "del /f /s /q",
      "format",
      "rmdir /s /q",
      "rd /s /q",
      "shutdown",
      "reg delete",
      "bcdedit",
      "diskpart"
    ]
  }
}
```

任何情況下均嚴禁執行或提出上述清單中的危險指令。
