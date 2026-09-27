/**
 * ClassDojo Changelog Manager
 * Strict compliance with User Rule 1: Maintain and display changelog on homepage.
 */

export const CHANGELOG_DATA = [
  {
    version: "v2.2.0 (最新發布)",
    date: "2026-09-27",
    isLatest: true,
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
