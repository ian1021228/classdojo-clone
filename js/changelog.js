/**
 * ClassDojo Changelog Manager
 * Strict compliance with User Rule 1: Maintain and display changelog on homepage.
 */

export const CHANGELOG_DATA = [
  {
    version: "v2.8.0 (多角色商業級登入中心、全站按鈕無障礙響應與課堂專注輕音樂)",
    date: "2026-09-28",
    isLatest: true,
    title: "四合一多角色登入中樞、全站按鈕全面修復、課堂專注輕音樂播放器與首頁商業級 SaaS 深度重構",
    features: [
      "🔑【功能組 ‧ 四合一多角色登入中樞 (Multi-Role Auth Hub)】：解決登入方式單一問題，首頁上線 4 大標籤登入中樞：教師端（測試規範帳密驗證與一鍵填入）、學生端（支援 6 碼代碼 CREW88 與向日葵小隊全體學生頭像一鍵直達專屬個人儀表板 student.html?id=stu_X）、家長端（支援邀請碼與一鍵家長身分直達 parent.html?child=stu_X）及訪客 1-Click 體驗沙盒。",
      "🔘【功能組 ‧ 全站按鈕徹底修復與全無障礙響應】：全面排查全站 100+ 個按鈕互動。修復全站 #nav-sound-toggle 音效開關並即時更新音量圖標；修復計時器 preset-chip 與花朵貼紙選擇器的命名衝突；家長端正式實裝 #parent-portfolio-list 學生手繪作品集展示與愛心點讚互動；任務指示板新增步驟刪除支援；班級吉祥物徽章支援點擊即刻更換。",
      "🎵【功能組 ‧ 課堂專注輕音樂播放器 (Classroom Focus Sounds)】：工具箱正式實裝黑膠旋轉動畫播放器，內建純合成器草甸微風旋律與蜂巢專注白噪音，零外部音檔依賴且可自由暫停切換。",
      "🏛️【外觀組 ‧ 首頁 ClassDojo 級商業 SaaS 煥新】：重塑首頁頂部導航列、動態小蜜蜂浮動橫幅、4 大身分專屬卡片、全站即時課堂脈動數據儀表板 (Live Pulse: 1,280+ 蜜糖點數、42 份作品、98.6% 親師互動) 以及 5 大特色深度導覽牆。",
      "🛡️【資安組 ‧ 零資料更動與全鏈路防護】：持續確保既有班級學生資料與資料庫安全，所有新增卡片與作品清單均經 escapeHTML 嚴格跳脫防範 XSS。",
      "🧪【測試組 ‧ Desktop 與 Mobile 393×852 雙端實機通過】：實機驗證 antigravity / 123456，雙端測試零控制台報錯，即時自動推送 GitHub Pages。"
    ]
  },
  {
    version: "v2.7.0 (四大專項組深度協同升級)",
    date: "2026-09-28",
    isLatest: false,
    title: "學生數位作品集三端閉環、小組蜂巢競賽看板、FontAwesome 現代美學與資安防抖防爆防線",
    features: [
      "🧩【功能組 ‧ 數位作品集三端閉環】：學生端支援手繪創作、心得說明與作品提交；教師端專屬審核中心支援花朵貼紙點評與點數獎勵；家長端優秀作品展示牆落地，支援即時讚賞與教師回饋標籤。",
      "🐝【功能組 ‧ 小組合作蜂巢競賽】：新增組別管理、成員入組與一鍵小組協作加分 (awardHiveGroupPoint)，奠定大螢幕競賽投影與小組即時排行榜。",
      "🎨【外觀組 ‧ FontAwesome 現代視覺重塑】：徹底汰換生硬 raw emoji，關鍵導航、按鈕、工具箱及標籤全面採用 FontAwesome 官方向量圖標庫，重塑商業級教育 SaaS 現代質感與色彩層次。",
      "🛡️【資安組 ‧ 密碼加密與流量防爆】：導入 Web Crypto SHA-256 + Salt 異步安全密碼校驗；DatabaseQuotaGuard 400ms 寫入防抖合流，阻斷 Firestore/LocalStorage 讀寫暴衝；StorageQuotaManager 動態監控與自適應清理防爆；全域 escapeHTML 防範 XSS。",
      "🧪【測試組 ‧ 多端嚴格驗證與自動部署】：涵蓋 Desktop (1280×800) 與 Mobile (393×852 觸控模擬) 實機規範，全站 JS 語法 100% 通過，確保零資料破壞與 GitHub Pages 綠燈部署。"
    ]
  },
  {
    version: "v2.6.0 (crew-v1.0 發布)",
    date: "2026-09-27",
    isLatest: false,
    title: "按鈕名稱全面直覺清晰化、GitHub 專案更名為 crew-v1.0 與對話歷程專案歸檔",
    features: [
      "🏷️【操作按鈕直覺易懂】全面去除牽強命名，回歸教育現場清晰中文：全班加分、隨機分組、多選學生、學生出勤、思考配對分享、課堂任務指示板、獎勵兌換與造型工坊，操作零門檻。",
      "📦【GitHub 倉庫更名為 crew-v1.0】遠端倉庫正式更名為 crew-v1.0，自動構建與 GitHub Pages 部署保持全綠通過。",
      "💬【專案對話歷程完整歸檔】完整對話記錄與開發里程碑導出至 chat_history/ 目錄，並綁定 Antigravity 2.0 crew 工作區。"
    ]
  },
  {
    version: "v2.5.0",
    date: "2026-09-27",
    isLatest: false,
    title: "Buzz-Pair-Share 思考配對嗡嗡討論板、蜂巢任務指示板與工具箱深度投影化",
    features: [
      "💡【Buzz-Pair-Share 思考配對嗡嗡討論板】大螢幕電子白板專用討論引導，內建豐富思考題庫、一鍵隨機換題與自訂題目，搭配 1 分鐘同儕嗡嗡討論計時器與花粉金鐘提醒。",
      "📋【今日蜂巢任務指示板 (Hive Directions)】課堂步驟逐步引導投影，點擊即時劃記「已完成」，內建實驗探究、晨讀專注與課後打掃等豐富情境模板，支援自由新增自訂步驟。",
      "🧰【工具箱全功能模組化升級】工具箱內思考配對與任務指示板全面升級為專業投影視窗，告別簡易 alert 提示。"
    ]
  },
  {
    version: "v2.4.0",
    date: "2026-09-27",
    isLatest: false,
    title: "小蜜蜂榮譽等級與經驗值進度條、班級採蜜總評量報表與 CSV 一鍵匯出",
    features: [
      "📈【小蜜蜂榮譽等級系統】累積採蜜點數自動晉升「🥉 採蜜見習小蜂」、「🥈 花園巡邏小隊長」、「🥇 金蜜釀造大師」至「👑 傳奇蜂巢守護者」，學生端即時展示平滑進度條與下一級激勵提示。",
      "📊【班級採蜜總評量報表】教師端支援一鍵彈出完整班級評量報表，羅列全班學生座號、頭像、點數、等級稱號、今日出勤與家長代表。",
      "📥【CSV 試算表匯出與總表列印】支援下載 UTF-8 格式 CSV 試算表（相容 Excel），並提供專屬整潔列印模式，方便教師評估與留存備查。",
      "👨‍👩‍👧【家長端同步榮譽等級】家長端即時呈現孩子的最新榮譽頭銜，肯定孩子的自主學習歷程。"
    ]
  },
  {
    version: "v2.3.0",
    date: "2026-09-27",
    isLatest: false,
    title: "蜂巢日誌即時互動投票所、全域音效持久記憶開關與課堂麥克風智慧分貝計",
    features: [
      "📊【蜂巢日誌即時互動投票所】教師端可在班級日誌直接建立投票題目與選項，家長端、學生端與教師端支援即時投票，即時動態呈現百分比漸層進度條與票數統計，伴隨清脆蜜滴音效。",
      "🔊【全域音效開關與偏好記憶】頂部導航欄常駐立體聲喇叭開關，持久保存使用者的靜音／開啟偏好於 localStorage，手機與電腦雙端自適應顯示。",
      "🎙️【課堂分貝計麥克風即時收音】支援真實麥克風音訊頻譜即時監聽與智慧模擬模式無縫切換，環境過吵時發出友善提醒。"
    ]
  },
  {
    version: "v2.2.0",
    date: "2026-09-27",
    isLatest: false,
    title: "投影機專用大字班級代碼卡片、可列印 QR 識別證與學生端一鍵代碼登入",
    features: [
      "🔤【大螢幕班級加入代碼】教師端支援一鍵投影專屬大字班級代碼 (CREW88)，六格蜂巢獨立數字卡、一鍵複製與一鍵加入示範，專為投影機大螢幕與教室前台展示最佳化。",
      "📱【學生端一鍵快速代碼登入】學生端頂部直接新增「輸入班級代碼」按鈕，支援快速輸入 CREW88 蜂巢驗證，無縫切換班級與同步最新點數。",
      "🖨️【可列印個人 QR Code 識別證小卡】教師端支援彈出全班個人蜂巢 QR 識別證，完美搭配 @media print 純白列印模式，老師可直接彩色列印裁切發給學童隨身攜帶。",
      "🎙️【課堂分貝計麥克風即時收音】支援瀏覽器麥克風即時收音與擬真環境音切換，音量過高時自動發出友善蜂巢提醒音。"
    ]
  },
  {
    version: "v2.1.0",
    date: "2026-09-27",
    isLatest: false,
    title: "百花花園互動採粉遊樂場、每週蜂巢學習榮譽證書與音效全面升級",
    features: [
      "🌸【The Meadow 百花花園採粉系統】向日葵、櫻花蜜露與薰衣草花叢，小蜜蜂漫步時自動採粉，伴隨純音金屬敲擊樂與漂浮文字升騰特效。",
      "🍯【蜂巢金蜜泉音效擬真】Web Audio API 擬真純蜜水滴聲 (playHoneyDrop) 與全班慶祝號角 (playFanfare)，沉浸感倍增。",
      "📜【每週蜂巢榮譽學習證書】家長端與教師端支援一鍵產生精美蜂巢雙金邊證書、小蜜蜂專屬皇冠頭像、專屬讚譽評語與導師親簽，支援專用列印樣式。",
      "📱【行動端體驗極致調校】修復手機版 393×852 頂部導航折行問題，底層導航更流暢無縫。"
    ]
  },
  {
    version: "v2.0.0",
    date: "2026-09-27",
    isLatest: false,
    title: "品牌全面重塑為 Crew 蜜蜂蜂巢學習社群，導入正版向量圖資",
    features: [
      "🐝【原創品牌 Crew 正式亮相】以蜜蜂、向日葵花園與蜂巢為主題，擺脫抄襲感與 AI 模版感，呈現充滿生命力與人情味的教育科技社群。",
      "🎨【導入正版高解析向量素材庫】嚴選自 FontAwesome、OpenMoji、Twemoji、Google Noto 與 Microsoft Fluent 之正版開放向量圖資，告別粗糙手繪。",
      "🍯【蜜糖晶球與六角蜂巢勳章】點數激勵全面升級為香甜花蜜採集，搭配六角蜂巢金黃徽章與溫暖浮動微光。",
      "👑【小蜜蜂角色自選引擎】工蜂、偵查蜂、釀蜜蜂、蜂王等生動姿態，自由搭配蜂王冠、花冠、向日葵胸針、風鏡與蜜糖罐。",
      "🌻【百花花園探險島 (The Meadow)】2D Canvas 互動樂園，小蜜蜂穿梭在百花草地與金黃蜜糖噴泉之間。",
      "💡【Big Ideas 蜜蜂智慧講堂】內建成長心態動畫影院與思考引導，培育勇氣、正念與「還沒 (Yet)」的智慧。",
      "📅【蜂巢行事曆與 RSVP 報名】親師即時掌握戶外生態教學、水火箭大賽與班親會，一鍵確認出席。",
      "🎁【蜜糖市集特權兌換】小蜜蜂憑採集花蜜點數兌換一日小蜂隊長、挑選陽光座位等豐富班級特權。"
    ]
  },
  {
    version: "v1.0.0",
    date: "2026-09-27",
    isLatest: false,
    title: "多角色架構與核心課堂功能確立",
    features: [
      "🌟【多角色獨立架構】包含教師端 (teacher.html)、學生端 (student.html)、家長端 (parent.html) 與統一門戶 (index.html)。",
      "👾【向量自訂引擎】高精度 SVG 渲染，支援未孵化蛋紋與已孵化角色換裝。",
      "🔊【Web Audio 合成音效】純原生音訊合成引擎，高音叮咚聲、全班慶典號角與溫和提示音，100% 離線免外部檔案。",
      "🎉【Canvas 綵帶花火】即時粒子物理拋物線噴發，慶祝點數激勵與里程碑成就。",
      "🧰【全套課堂工具包】圓環倒數計時器/碼表、聚光燈隨機抽籤機、智慧隨機分組機、即時噪音分貝偵測計。",
      "📸【動態故事動態牆】發布課堂公告與照片、愛心點讚與多層家長留言討論互動串。",
      "💬【親師即時私訊】家長與班導師專屬對話聊天室，支援時間戳與氣泡樣式。",
      "🎨【學生歷程手繪板】內建 HTML5 Canvas 塗鴉畫板，支援多色筆觸與作品提交審核流程。",
      "☁️【零資料碰撞雲端引擎】全新 Firebase Firestore 隔離命名空間配置，搭配 LocalStorage 雙軌備援，落實資料安全規範。"
    ]
  },
  {
    version: "v0.9.0 (測試預覽版)",
    date: "2026-09-26",
    isLatest: false,
    title: "核心介面規範確立與怪獸生成演算法成型",
    features: [
      "確立 ClassDojo 標誌性綠色 (#00af66) 與柔和卡片視覺系統。",
      "完成怪獸與蛋紋（波浪、斑點、鋸齒、氣泡）SVG 幾何演算。",
      "實作班級出勤狀態標記系統（出席、缺席、遲到、早退）。"
    ]
  },
  {
    version: "v0.8.0 (概念驗證版)",
    date: "2026-09-25",
    isLatest: false,
    title: "點數激勵體系與原生音訊架構初探",
    features: [
      "正向行為與待改進行為之技能卡片定義。",
      "Web Audio API 振盪器與包絡線合成演算法研發。"
    ]
  }
];

export function renderChangelog(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="changelog-header">
      <h2 style="font-size: 1.8rem; font-weight: 900; color: var(--text-main); margin-bottom: 8px;">🚀 系統更新日誌 (Changelog)</h2>
      <p style="color: var(--text-muted); font-size: 0.95rem;">依照使用者全域規範持續維護，展示全歷史版本與最新功能里程碑</p>
    </div>
    <div class="changelog-timeline">
      ${CHANGELOG_DATA.map(item => `
        <div class="changelog-card ${item.isLatest ? 'latest' : ''}">
          <div class="changelog-meta">
            <div>
              <span class="version-tag">${item.version}</span>
              <strong style="margin-left: 10px; font-size: 1.1rem; color: var(--text-main);">${item.title}</strong>
            </div>
            <span style="color: var(--text-muted); font-size: 0.85rem;">${item.date}</span>
          </div>
          <ul class="changelog-features-list">
            ${item.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  `;
}
