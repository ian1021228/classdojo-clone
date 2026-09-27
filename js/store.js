/**
 * ClassDojo Central Reactive Data Store
 * Manages classes, students, feedback points, attendance, stories, messages, and portfolios.
 * Supports isolated dual-mode persistence (Firestore + LocalStorage).
 */

import { dataEngine } from './firebase-config.js';
import { escapeHTML, hashPassword, verifyPassword, maskSensitiveCode, DatabaseQuotaGuard, StorageQuotaManager } from './security.js';

// Pre-seeded Rich Demo Data for Crew Beehive Classroom
const INITIAL_DATA = {
  activeClassId: 'cls_demo_class',
  currentUser: {
    role: 'teacher', // 'teacher' | 'student' | 'parent'
    username: 'antigravity',
    displayName: '林老師 (青青草地小學 ‧ 向日葵蜂巢班)',
    activeStudentId: 'stu_demo_1',
    passwordHash: 'a4b2c7a2217be305973615237f9b904a62b9b032b9c8bd9c069f3258dbf0ad0c', // SHA-256 of crew_salt_2026:123456
    salt: 'crew_salt_2026'
  },
  classes: [
    {
      id: 'cls_demo_class',
      name: '向日葵四年一班 (Crew Sunflowers)',
      school: '青青草地實驗小學',
      grade: '四年級蜂巢班',
      icon: '🌻',
      code: 'CREW88',
      totalPoints: 18,
      skills: {
        positive: [
          { id: 'pos_honey', name: '🐝 勤奮採蜜 (Hardworking)', points: 1, icon: '🐝' },
          { id: 'pos_pollen', name: '🌸 傳粉互助 (Helping others)', points: 1, icon: '🌸' },
          { id: 'pos_focus', name: '🎯 專注飛行 (Deep focus)', points: 1, icon: '🎯' },
          { id: 'pos_sharing', name: '🍯 釀蜜分享 (Kind sharing)', points: 1, icon: '🍯' },
          { id: 'pos_wisdom', name: '💡 蜂巢巧思 (Creativity)', points: 1, icon: '💡' },
          { id: 'pos_leader', name: '👑 蜂巢小隊長 (Crew leader)', points: 2, icon: '👑' }
        ],
        needsWork: [
          { id: 'neg_distracted', name: '💨 飛行走神 (Distracted)', points: -1, icon: '💨' },
          { id: 'neg_unprepared', name: '🥀 忘帶採蜜工具 (Unprepared)', points: -1, icon: '🥀' },
          { id: 'neg_buzz', name: '🐝💥 推擠喧嘩 (Disruptive buzz)', points: -1, icon: '⚠️' },
          { id: 'neg_late', name: '⏳ 晚進蜂巢 (Tardy)', points: -1, icon: '⏳' }
        ]
      },
      students: [
        {
          id: 'stu_demo_1',
          name: 'Beyoncé',
          seatNumber: 1,
          points: 5,
          isHatched: true,
          monster: { colorIdx: 0, bodyShape: 'pear', accessory: 'horns' },
          attendance: 'present',
          parentName: 'Beyoncé 家長',
          parentCode: 'P-BEY01',
          history: [
            { id: 'hd1', skillName: '🐝 勤奮採蜜', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '主動帶領小組整理觀察植物' },
            { id: 'hd1_2', skillName: '👑 蜂巢小隊長', points: 2, type: 'pos', timestamp: Date.now() - 7200000, note: '協助整隊排隊有禮貌' }
          ]
        },
        {
          id: 'stu_demo_2',
          name: 'Denzel',
          seatNumber: 2,
          points: 4,
          isHatched: true,
          monster: { colorIdx: 1, bodyShape: 'round', accessory: 'bow' },
          attendance: 'present',
          parentName: 'Denzel 家長',
          parentCode: 'P-DEN02',
          history: [
            { id: 'hd2', skillName: '🎯 專注飛行', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '課堂數學解題全神貫注' }
          ]
        },
        {
          id: 'stu_demo_3',
          name: 'Jennifer',
          seatNumber: 3,
          points: 3,
          isHatched: true,
          monster: { colorIdx: 4, bodyShape: 'blob', accessory: 'party_hat' },
          attendance: 'present',
          parentName: 'Jennifer 家長',
          parentCode: 'P-JEN03',
          history: [
            { id: 'hd3', skillName: '🌸 傳粉互助', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '熱心教導隔壁同學折紙飛機' }
          ]
        },
        {
          id: 'stu_demo_4',
          name: 'Justin',
          seatNumber: 4,
          points: 3,
          isHatched: true,
          monster: { colorIdx: 2, bodyShape: 'tall', accessory: 'antenna' },
          attendance: 'present',
          parentName: 'Justin 家長',
          parentCode: 'P-JUS04',
          history: [
            { id: 'hd4', skillName: '🍯 釀蜜分享', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '主動分享彩色畫筆' }
          ]
        },
        {
          id: 'stu_demo_5',
          name: 'Leonardo',
          seatNumber: 5,
          points: 3,
          isHatched: true,
          monster: { colorIdx: 3, bodyShape: 'fluffy', accessory: 'glasses' },
          attendance: 'present',
          parentName: 'Leonardo 家長',
          parentCode: 'P-LEO05',
          history: [
            { id: 'hd5', skillName: '💡 蜂巢巧思', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '提出浮力實驗的新測試點子' }
          ]
        }
      ],
      groups: [
        { id: 'grp_demo_1', name: '🌻 向日葵偵查小隊', studentIds: ['stu_demo_1', 'stu_demo_2'], points: 9, goalPoints: 30, icon: 'fa-solid fa-people-group', color: '#f59e0b', createdAt: 1727400000000 },
        { id: 'grp_demo_2', name: '🍯 金蜜釀造小隊', studentIds: ['stu_demo_3', 'stu_demo_4', 'stu_demo_5'], points: 9, goalPoints: 30, icon: 'fa-solid fa-people-group', color: '#eab308', createdAt: 1727400000000 }
      ]
    },
    {
      id: 'cls_dojo_1',
      name: '三年甲班 快樂冒險家 (Grade 3 - Joyful Explorers)',
      grade: '三年級',
      icon: '🚀',
      code: 'DOJO77',
      totalPoints: 48,
      skills: {
        positive: [
          { id: 'pos_help', name: '樂於助人 (Helping others)', points: 1, icon: '🤝' },
          { id: 'pos_ontask', name: '專注課堂 (On task)', points: 1, icon: '🎯' },
          { id: 'pos_part', name: '積極發言 (Participating)', points: 1, icon: '🙋' },
          { id: 'pos_persist', name: '堅持不懈 (Persistence)', points: 1, icon: '🧗' },
          { id: 'pos_team', name: '團隊合作 (Teamwork)', points: 1, icon: '🧩' },
          { id: 'pos_hard', name: '認真投入 (Working hard)', points: 1, icon: '⭐' }
        ],
        needsWork: [
          { id: 'neg_offtask', name: '課堂分心 (Off task)', points: -1, icon: '⏳' },
          { id: 'neg_talk', name: '未舉手發言 (Talking out of turn)', points: -1, icon: '🗣️' },
          { id: 'neg_disrespect', name: '缺乏禮貌 (Disrespect)', points: -1, icon: '🙅' },
          { id: 'neg_nohw', name: '未帶作業 (No homework)', points: -1, icon: '📝' },
          { id: 'neg_unprepared', name: '缺學用品 (Unprepared)', points: -1, icon: '🎒' }
        ]
      },
      students: [
        {
          id: 'stu_1',
          name: '王小明 (Leo)',
          seatNumber: 1,
          points: 12,
          isHatched: true,
          monster: { colorIdx: 0, bodyShape: 'round', eyeStyle: 'two_big', mouthStyle: 'smile', accessory: 'party_hat' },
          attendance: 'present',
          parentName: '王媽媽',
          parentCode: 'P-LEO01',
          history: [
            { id: 'h1', skillName: '樂於助人', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '主動幫同學整理課本' },
            { id: 'h2', skillName: '專注課堂', points: 1, type: 'pos', timestamp: Date.now() - 7200000, note: '數學課認真練習' }
          ]
        },
        {
          id: 'stu_2',
          name: '陳小華 (Emma)',
          seatNumber: 2,
          points: 15,
          isHatched: true,
          monster: { colorIdx: 5, bodyShape: 'pear', eyeStyle: 'happy', mouthStyle: 'cute_open', accessory: 'bow' },
          attendance: 'present',
          parentName: '陳爸爸',
          parentCode: 'P-EMM02',
          history: [
            { id: 'h3', skillName: '團隊合作', points: 1, type: 'pos', timestamp: Date.now() - 5400000, note: '科學小組優秀引導' }
          ]
        },
        {
          id: 'stu_3',
          name: '李冠宇 (Justin)',
          seatNumber: 3,
          points: 8,
          isHatched: true,
          monster: { colorIdx: 1, bodyShape: 'blob', eyeStyle: 'cyclops', mouthStyle: 'grin_teeth', accessory: 'antenna' },
          attendance: 'present',
          parentName: '李媽媽',
          parentCode: 'P-JUS03',
          history: [
            { id: 'h4', skillName: '堅持不懈', points: 1, type: 'pos', timestamp: Date.now() - 10800000, note: '克服難題完成作文' }
          ]
        },
        {
          id: 'stu_4',
          name: '張雅涵 (Chloe)',
          seatNumber: 4,
          points: 10,
          isHatched: true,
          monster: { colorIdx: 2, bodyShape: 'tall', eyeStyle: 'three_eyes', mouthStyle: 'smile', accessory: 'glasses' },
          attendance: 'tardy',
          parentName: '張媽媽',
          parentCode: 'P-CHL04',
          history: [
            { id: 'h5', skillName: '積極發言', points: 1, type: 'pos', timestamp: Date.now() - 14400000, note: '英語朗讀非常自信' }
          ]
        },
        {
          id: 'stu_5',
          name: '林子傑 (Lucas)',
          seatNumber: 5,
          points: 6,
          isHatched: false, // Monster Egg!
          seed: 'LucasEgg',
          attendance: 'present',
          parentName: '林爸爸',
          parentCode: 'P-LUC05',
          history: []
        },
        {
          id: 'stu_6',
          name: '黃詠晴 (Sunny)',
          seatNumber: 6,
          points: 14,
          isHatched: true,
          monster: { colorIdx: 4, bodyShape: 'fluffy', eyeStyle: 'sleepy', mouthStyle: 'tongue', accessory: 'horns' },
          attendance: 'present',
          parentName: '黃媽媽',
          parentCode: 'P-SUN06',
          history: [
            { id: 'h6', skillName: '認真投入', points: 1, type: 'pos', timestamp: Date.now() - 1800000, note: '值日生打掃非常乾淨' }
          ]
        },
        {
          id: 'stu_7',
          name: '郭宇辰 (Ryan)',
          seatNumber: 7,
          points: 7,
          isHatched: false, // Monster Egg!
          seed: 'RyanEgg',
          attendance: 'absent',
          parentName: '郭爸爸',
          parentCode: 'P-RYA07',
          history: []
        },
        {
          id: 'stu_8',
          name: '周芷瑄 (Zoe)',
          seatNumber: 8,
          points: 11,
          isHatched: true,
          monster: { colorIdx: 6, bodyShape: 'round', eyeStyle: 'two_big', mouthStyle: 'grin_teeth', accessory: 'ears' },
          attendance: 'present',
          parentName: '周媽媽',
          parentCode: 'P-ZOE08',
          history: [
            { id: 'h7', skillName: '樂於助人', points: 1, type: 'pos', timestamp: Date.now() - 9000000, note: '教同學跳繩技巧' }
          ]
        }
      ],
      groups: [
        { id: 'grp_1', name: '🚀 火箭飛船組', studentIds: ['stu_1', 'stu_2', 'stu_3', 'stu_4'], points: 25 },
        { id: 'grp_2', name: '⭐ 星辰探索隊', studentIds: ['stu_5', 'stu_6', 'stu_7', 'stu_8'], points: 23 }
      ]
    },
    {
      id: 'cls_dojo_2',
      name: '五年乙班 創客先鋒隊 (Grade 5 - Maker Pioneers)',
      grade: '五年級',
      icon: '🔬',
      code: 'MKR505',
      totalPoints: 32,
      skills: {
        positive: [
          { id: 'pos_maker_1', name: '創意發想 (Creativity)', points: 1, icon: '💡' },
          { id: 'pos_maker_2', name: '動手實作 (Hands-on)', points: 1, icon: '🛠️' },
          { id: 'pos_maker_3', name: '團隊協作 (Teamwork)', points: 1, icon: '🤝' }
        ],
        needsWork: [
          { id: 'neg_maker_1', name: '未收拾工具 (Messy station)', points: -1, icon: '🧹' }
        ]
      },
      students: [
        {
          id: 'stu_201',
          name: '劉德華 (Andy)',
          seatNumber: 1,
          points: 18,
          isHatched: true,
          monster: { colorIdx: 3, bodyShape: 'round', eyeStyle: 'two_big', mouthStyle: 'smile', accessory: 'glasses' },
          attendance: 'present',
          parentName: '劉媽媽',
          parentCode: 'P-AND01',
          history: []
        },
        {
          id: 'stu_202',
          name: '蔡依林 (Jolin)',
          seatNumber: 2,
          points: 14,
          isHatched: true,
          monster: { colorIdx: 5, bodyShape: 'fluffy', eyeStyle: 'happy', mouthStyle: 'cute_open', accessory: 'bow' },
          attendance: 'present',
          parentName: '蔡爸爸',
          parentCode: 'P-JOL02',
          history: []
        }
      ],
      groups: []
    }
  ],
  stories: [
    {
      id: 'post_1',
      author: '林老師 (Teacher Lin)',
      classId: 'cls_demo_class',
      timestamp: Date.now() - 7200000,
      content: '🌻 今天的自然科學探究課，向日葵蜂巢小隊完成了水火箭壓力觀測與植物授粉觀察！小蜜蜂們分工合作採集數據，互相支援記錄，全班氛圍超級棒！為大家的認真精神喝采！👏🍯✨',
      image: '',
      likes: 15,
      liked: false,
      poll: {
        id: 'poll_demo_1',
        question: '🌻 本週五百花生態探險，大家最期待的觀察主題是什麼呢？',
        options: [
          { id: 'opt_1', text: '向日葵花田與授粉特徵觀察', votes: 12 },
          { id: 'opt_2', text: '小蜜蜂飛行路徑與六角蜂巢結構', votes: 16 },
          { id: 'opt_3', text: '植物拓印與野花蜜露標本採集', votes: 9 }
        ],
        userVoted: null
      },
      comments: [
        { id: 'c1', author: 'Beyoncé 家長', text: 'Beyoncé 回家後興奮地跟我們分享水火箭原理，太有熱情了！謝謝老師用心引導 ❤️', time: '1 小時前' },
        { id: 'c2', author: 'Denzel 家長', text: '看到孩子們自信開心的笑容真棒，謝謝老師！', time: '30 分鐘前' }
      ]
    },
    {
      id: 'post_2',
      author: '林老師 (Teacher Lin)',
      classId: 'cls_demo_class',
      timestamp: Date.now() - 86400000,
      content: '📢【週五百花生態園戶外探險提醒】親愛的家長您好，本週五為生態植物拓印與野餐日，請小蜜蜂們穿著舒適運動服裝、攜帶個人水壺與輕便背包，期待和大家在大自然中盡情觀察與寫生！🌸🌿',
      image: '',
      likes: 22,
      liked: true,
      comments: [
        { id: 'c3', author: 'Jennifer 家長', text: '收到通知！當天會幫孩子準備遮陽帽與溫水！', time: '昨天' }
      ]
    }
  ],
  messages: {
    'stu_demo_1': [
      { id: 'm1', sender: 'teacher', text: 'Beyoncé 家長您好！Beyoncé 今天在課堂上表現非常出色，主動幫小組整理觀察植物，特別頒發了 2 滴蜜糖點數鼓勵喔！', timestamp: Date.now() - 18000000 },
      { id: 'm2', sender: 'parent', text: '謝謝林老師的用心鼓勵！Beyoncé 回到家一直好開心地展示她的小蜜蜂皇冠勳章，我們會繼續支持她！', timestamp: Date.now() - 14400000 },
      { id: 'm3', sender: 'teacher', text: '不客氣！Beyoncé 的善良與熱心是全班小蜂隊員的榜樣，有任何事情隨時和我聯絡喔！😊', timestamp: Date.now() - 10800000 }
    ],
    'stu_demo_2': [
      { id: 'm4', sender: 'teacher', text: 'Denzel 家長您好，Denzel 今天在數學專注飛行解題很棒，作品已經收錄在蜂巢作品檔案中！', timestamp: Date.now() - 36000000 },
      { id: 'm5', sender: 'parent', text: '太好了，我們剛剛在手機端看到作品了，畫得真生動！謝謝老師！', timestamp: Date.now() - 28800000 }
    ]
  },
  portfolios: [
    {
      id: 'act_1',
      classId: 'cls_demo_class',
      title: '🌻 向日葵花園小蜜蜂手繪創作',
      description: '用手繪板繪製出你在花園中採集蜜糖的好夥伴，並為他取一個響亮的名字！',
      submissions: [
        {
          id: 'sub_1',
          classId: 'cls_demo_class',
          activityId: 'act_1',
          studentId: 'stu_demo_1',
          studentName: 'Beyoncé',
          title: '🌻 向日葵花園小蜜蜂手繪創作',
          typeTag: 'drawing',
          type: 'drawing',
          outcomeText: '這是我設計的向日葵小蜜蜂，它有黃金條紋和亮晶晶的翅膀，最喜歡採集香甜的向日葵花蜜！🌻',
          caption: '這是我設計的向日葵小蜜蜂，它有黃金條紋和亮晶晶的翅膀，最喜歡採集香甜的向日葵花蜜！🌻',
          reflection: '學會了運用幾何圓形與漸層黃色來呈現小蜜蜂的身體，下次我想嘗試畫出更多花瓣背景！',
          mediaUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23fffdf5"/><circle cx="150" cy="100" r="50" fill="%23f59e0b"/><circle cx="135" cy="90" r="10" fill="%23fff"/><circle cx="165" cy="90" r="10" fill="%23fff"/><circle cx="137" cy="90" r="5" fill="%231e293b"/><circle cx="167" cy="90" r="5" fill="%231e293b"/><path d="M 135 115 Q 150 135 165 115" stroke="%231e293b" stroke-width="4" fill="none"/></svg>',
          drawingData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23fffdf5"/><circle cx="150" cy="100" r="50" fill="%23f59e0b"/><circle cx="135" cy="90" r="10" fill="%23fff"/><circle cx="165" cy="90" r="10" fill="%23fff"/><circle cx="137" cy="90" r="5" fill="%231e293b"/><circle cx="167" cy="90" r="5" fill="%231e293b"/><path d="M 135 115 Q 150 135 165 115" stroke="%231e293b" stroke-width="4" fill="none"/></svg>',
          status: 'approved',
          timestamp: Date.now() - 43200000,
          teacherFeedback: '向日葵小蜜蜂的神情非常生動，配色溫暖，展現了極佳的觀察力與手繪美感！',
          flowerSticker: '🌸 構思精巧花',
          honeyPoints: 2,
          reviewedAt: Date.now() - 43000000,
          isPublishedToStory: true,
          isPublishedToParent: true,
          parentLikes: 3,
          revisionNote: ''
        },
        {
          id: 'sub_2',
          classId: 'cls_demo_class',
          activityId: 'act_1',
          studentId: 'stu_demo_2',
          studentName: 'Denzel',
          title: '飛行小蜂隊長',
          typeTag: 'drawing',
          type: 'drawing',
          outcomeText: '飛行小蜂隊長，頭頂戴著向日葵徽章，守護著花園裡的花朵！✨',
          caption: '飛行小蜂隊長，頭頂戴著向日葵徽章，守護著花園裡的花朵！✨',
          reflection: '我想讓隊長的翅膀看起來更有速度感，所以加了明亮的光圈與線條。',
          mediaUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23fefce8"/><circle cx="150" cy="100" r="55" fill="%23eab308"/><circle cx="150" cy="85" r="12" fill="%23fff"/><circle cx="152" cy="85" r="6" fill="%231e293b"/><path d="M 135 115 Q 150 130 165 115" stroke="%231e293b" stroke-width="4" fill="none"/></svg>',
          drawingData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23fefce8"/><circle cx="150" cy="100" r="55" fill="%23eab308"/><circle cx="150" cy="85" r="12" fill="%23fff"/><circle cx="152" cy="85" r="6" fill="%231e293b"/><path d="M 135 115 Q 150 130 165 115" stroke="%231e293b" stroke-width="4" fill="none"/></svg>',
          status: 'pending',
          timestamp: Date.now() - 7200000,
          teacherFeedback: '',
          flowerSticker: '',
          honeyPoints: 0,
          reviewedAt: null,
          isPublishedToStory: false,
          isPublishedToParent: false,
          parentLikes: 0,
          revisionNote: ''
        }
      ]
    }
  ]
};

class DojoStore {
  constructor() {
    this.subscribers = new Set();
    this.state = dataEngine.loadState(INITIAL_DATA);

    // Defensive state loading and schema migration
    if (!this.state || typeof this.state !== 'object') {
      this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    if (!Array.isArray(this.state.classes) || this.state.classes.length === 0) {
      this.state.classes = JSON.parse(JSON.stringify(INITIAL_DATA.classes));
    }

    this.state.activeClassId = this.state.activeClassId || (this.state.classes[0] ? this.state.classes[0].id : 'cls_demo_class');
    this.state.stories = Array.isArray(this.state.stories) ? this.state.stories : JSON.parse(JSON.stringify(INITIAL_DATA.stories || []));
    this.state.messages = (this.state.messages && typeof this.state.messages === 'object') ? this.state.messages : {};
    this.state.portfolios = (Array.isArray(this.state.portfolios) && this.state.portfolios.length > 0)
      ? this.state.portfolios
      : JSON.parse(JSON.stringify(INITIAL_DATA.portfolios || []));

    // Ensure groups and schema consistency in each class
    this.state.classes.forEach(cls => {
      if (!Array.isArray(cls.students)) cls.students = [];
      if (!Array.isArray(cls.groups)) cls.groups = [];
      cls.groups.forEach(grp => {
        if (!grp.icon) grp.icon = 'fa-solid fa-people-group';
        if (!grp.color) grp.color = '#f59e0b';
        if (!grp.goalPoints) grp.goalPoints = 30;
        if (!Array.isArray(grp.studentIds)) grp.studentIds = [];
        grp.points = (typeof grp.points === 'number' && grp.points > 0)
          ? grp.points
          : this.calculateGroupPoints(cls, grp.studentIds);
        if (!grp.createdAt) grp.createdAt = Date.now();
      });
    });

    dataEngine.saveState(this.state);

    // Listen for storage changes from other tabs or firebase
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', (e) => {
        if (e.key === dataEngine.storageKey) {
          this.state = dataEngine.loadState(INITIAL_DATA);
          this.notify();
        }
      });
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(cb => {
      try { cb(this.state); } catch (e) { console.error(e); }
    });
  }

  save() {
    dataEngine.saveState(this.state);
    this.notify();
  }

  // Active class getter
  getActiveClass() {
    const cls = this.state.classes.find(c => c.id === this.state.activeClassId);
    return cls || this.state.classes[0];
  }

  setActiveClass(classId) {
    this.state.activeClassId = classId;
    this.save();
  }

  // Add new class
  addClass(name, grade = '三年級') {
    const newClass = {
      id: `cls_${Date.now()}`,
      name,
      grade,
      icon: '🎒',
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      totalPoints: 0,
      skills: JSON.parse(JSON.stringify(INITIAL_DATA.classes[0].skills)),
      students: [],
      groups: []
    };
    this.state.classes.push(newClass);
    this.state.activeClassId = newClass.id;
    this.save();
    return newClass;
  }

  // Add student
  addStudent(classId, studentName) {
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return null;

    const newStudent = {
      id: `stu_${Date.now()}`,
      name: studentName,
      seatNumber: cls.students.length + 1,
      points: 0,
      isHatched: false, // Start as egg like authentic ClassDojo!
      seed: `${studentName}_${Date.now()}`,
      attendance: 'present',
      parentName: `${studentName.slice(0, 1)}家長`,
      parentCode: `P-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      history: []
    };
    cls.students.push(newStudent);
    this.save();
    return newStudent;
  }

  // Award points to individual student
  awardStudentPoint(classId, studentId, skill) {
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return null;
    const student = cls.students.find(s => s.id === studentId);
    if (!student) return null;

    student.points += skill.points;
    cls.totalPoints += skill.points;

    const historyItem = {
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      skillName: skill.name,
      points: skill.points,
      type: skill.points >= 0 ? 'pos' : 'neg',
      icon: skill.icon,
      timestamp: Date.now(),
      note: skill.note || ''
    };
    student.history.unshift(historyItem);

    if (Array.isArray(cls.groups)) {
      cls.groups.forEach(g => {
        if (g.studentIds && g.studentIds.includes(studentId)) {
          g.points = this.calculateGroupPoints(cls, g.studentIds);
        }
      });
    }

    this.save();
    return { student, historyItem };
  }

  // Award points to whole class
  awardWholeClassPoint(classId, skill) {
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return null;

    cls.students.forEach(student => {
      student.points += skill.points;
      student.history.unshift({
        id: `h_all_${Date.now()}_${student.id}`,
        skillName: `[全班] ${skill.name}`,
        points: skill.points,
        type: skill.points >= 0 ? 'pos' : 'neg',
        icon: skill.icon,
        timestamp: Date.now()
      });
    });

    cls.totalPoints += skill.points * cls.students.length;
    if (Array.isArray(cls.groups)) {
      cls.groups.forEach(g => {
        g.points = this.calculateGroupPoints(cls, g.studentIds);
      });
    }

    this.save();
    return cls;
  }

  // Award points to multiple selected students
  awardMultipleStudents(classId, studentIds, skill) {
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return null;

    studentIds.forEach(id => {
      const student = cls.students.find(s => s.id === id);
      if (student) {
        student.points += skill.points;
        student.history.unshift({
          id: `h_multi_${Date.now()}_${student.id}`,
          skillName: skill.name,
          points: skill.points,
          type: skill.points >= 0 ? 'pos' : 'neg',
          icon: skill.icon,
          timestamp: Date.now()
        });
      }
    });

    cls.totalPoints += skill.points * studentIds.length;
    if (Array.isArray(cls.groups)) {
      cls.groups.forEach(g => {
        g.points = this.calculateGroupPoints(cls, g.studentIds);
      });
    }

    this.save();
    return cls;
  }

  // Calculate total points for a group based on current member points
  calculateGroupPoints(cls, studentIds = []) {
    if (!cls || !Array.isArray(cls.students) || !Array.isArray(studentIds)) return 0;
    return studentIds.reduce((sum, sid) => {
      const s = cls.students.find(st => st.id === sid);
      return sum + (s && typeof s.points === 'number' ? s.points : 0);
    }, 0);
  }

  // Create a new Hive Group
  createHiveGroup(classId, { name, studentIds = [], icon = 'fa-solid fa-people-group', color = '#f59e0b', goalPoints = 30 } = {}) {
    const targetClassId = classId || this.state.activeClassId;
    const cls = this.state.classes.find(c => c.id === targetClassId);
    if (!cls) return null;
    if (!Array.isArray(cls.groups)) cls.groups = [];

    const uniqueStudentIds = Array.from(new Set(Array.isArray(studentIds) ? studentIds : []));
    const newGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: (name || '蜂巢合作小組').trim(),
      icon: icon || 'fa-solid fa-people-group',
      color: color || '#f59e0b',
      studentIds: uniqueStudentIds,
      points: this.calculateGroupPoints(cls, uniqueStudentIds),
      goalPoints: Number(goalPoints) || 30,
      createdAt: Date.now()
    };

    cls.groups.push(newGroup);
    this.save();
    return newGroup;
  }

  // Update an existing Hive Group
  updateHiveGroup(classId, groupId, updates = {}) {
    const targetClassId = classId || this.state.activeClassId;
    const cls = this.state.classes.find(c => c.id === targetClassId);
    if (!cls || !Array.isArray(cls.groups)) return null;

    const grp = cls.groups.find(g => g.id === groupId);
    if (!grp) return null;

    if (updates.name !== undefined) grp.name = updates.name.trim();
    if (updates.icon !== undefined) grp.icon = updates.icon;
    if (updates.color !== undefined) grp.color = updates.color;
    if (updates.studentIds !== undefined) {
      grp.studentIds = Array.from(new Set(Array.isArray(updates.studentIds) ? updates.studentIds : []));
    }
    if (updates.goalPoints !== undefined) {
      grp.goalPoints = Number(updates.goalPoints) || 30;
    }
    if (updates.points !== undefined) {
      grp.points = Number(updates.points);
    } else {
      grp.points = this.calculateGroupPoints(cls, grp.studentIds);
    }

    this.save();
    return grp;
  }

  // Delete a Hive Group
  deleteHiveGroup(classId, groupId) {
    const targetClassId = classId || this.state.activeClassId;
    const cls = this.state.classes.find(c => c.id === targetClassId);
    if (!cls || !Array.isArray(cls.groups)) return false;

    const idx = cls.groups.findIndex(g => g.id === groupId);
    if (idx !== -1) {
      cls.groups.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Award points to all members in a Hive Group, updating class total and group points
  awardHiveGroupPoint(classId, groupId, skill) {
    const targetClassId = classId || this.state.activeClassId;
    const cls = this.state.classes.find(c => c.id === targetClassId);
    if (!cls || !Array.isArray(cls.groups)) return null;

    const grp = cls.groups.find(g => g.id === groupId);
    if (!grp) return null;

    const points = typeof skill.points === 'number' ? skill.points : 1;
    let awardedCount = 0;

    (grp.studentIds || []).forEach(sid => {
      const student = cls.students.find(s => s.id === sid);
      if (student) {
        student.points += points;
        if (!Array.isArray(student.history)) student.history = [];
        student.history.unshift({
          id: `h_grp_${Date.now()}_${student.id}`,
          skillName: `[${grp.name}] ${skill.name}`,
          points: points,
          type: points >= 0 ? 'pos' : 'neg',
          icon: skill.icon || 'fa-solid fa-users',
          timestamp: Date.now(),
          note: skill.note || `小組協作榮譽：${grp.name}`
        });
        awardedCount++;
      }
    });

    cls.totalPoints += points * awardedCount;
    grp.points = this.calculateGroupPoints(cls, grp.studentIds);

    this.save();
    return { group: grp, awardedCount };
  }

  // Set student attendance
  setAttendance(classId, studentId, status) {
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return;
    const student = cls.students.find(s => s.id === studentId);
    if (student) {
      student.attendance = status;
      this.save();
    }
  }

  // Hatch or customize monster
  updateStudentMonster(classId, studentId, monsterTraits) {
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return;
    const student = cls.students.find(s => s.id === studentId);
    if (student) {
      student.isHatched = true;
      student.monster = monsterTraits;
      this.save();
    }
  }

  // Add story post
  addStoryPost(classId, author, content, image = '', poll = null) {
    const post = {
      id: `post_${Date.now()}`,
      author,
      classId,
      timestamp: Date.now(),
      content,
      image,
      likes: 0,
      liked: false,
      poll: poll || null,
      comments: []
    };
    this.state.stories.unshift(post);
    this.save();
    return post;
  }

  // Vote on story poll
  voteStoryPoll(postId, optionId) {
    const post = this.state.stories.find(p => p.id === postId);
    if (!post || !post.poll) return;

    if (post.poll.userVoted === optionId) return;

    if (post.poll.userVoted) {
      const prevOpt = post.poll.options.find(o => o.id === post.poll.userVoted);
      if (prevOpt && prevOpt.votes > 0) prevOpt.votes--;
    }

    const newOpt = post.poll.options.find(o => o.id === optionId);
    if (newOpt) {
      newOpt.votes = (newOpt.votes || 0) + 1;
      post.poll.userVoted = optionId;
    }
    this.save();
    return post;
  }

  // Like story post
  togglePostLike(postId) {
    const post = this.state.stories.find(p => p.id === postId);
    if (!post) return;
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    this.save();
    return post;
  }

  // Add comment to post
  addPostComment(postId, author, text) {
    const post = this.state.stories.find(p => p.id === postId);
    if (!post) return;
    const comment = {
      id: `c_${Date.now()}`,
      author,
      text,
      time: '剛剛'
    };
    post.comments.push(comment);
    this.save();
    return comment;
  }

  // Send message
  sendMessage(studentId, sender, text) {
    if (!this.state.messages[studentId]) {
      this.state.messages[studentId] = [];
    }
    const msg = {
      id: `m_${Date.now()}`,
      sender, // 'teacher' | 'parent'
      text,
      timestamp: Date.now()
    };
    this.state.messages[studentId].push(msg);
    this.save();
    return msg;
  }

  // Adapter to guarantee all new schema fields exist on legacy or newly created submissions
  adaptSubmission(sub, activity = {}) {
    if (!sub) return null;
    const actTitle = activity.title || '課堂學習成果';
    const actId = activity.id || sub.activityId || 'act_1';
    const actClassId = activity.classId || sub.classId || this.state.activeClassId || 'cls_demo_class';

    return {
      id: sub.id,
      classId: sub.classId || actClassId,
      activityId: sub.activityId || actId,
      activityTitle: sub.activityTitle || actTitle,
      studentId: sub.studentId,
      studentName: sub.studentName,
      title: sub.title || actTitle,
      typeTag: sub.typeTag || sub.type || 'drawing',
      outcomeText: sub.outcomeText || sub.caption || '',
      reflection: sub.reflection || '',
      mediaUrl: sub.mediaUrl || sub.drawingData || '',
      drawingData: sub.drawingData || sub.mediaUrl || '',
      caption: sub.caption || sub.outcomeText || sub.title || '',
      status: sub.status || 'pending',
      timestamp: sub.timestamp || Date.now(),
      teacherFeedback: sub.teacherFeedback || '',
      flowerSticker: sub.flowerSticker || (sub.status === 'approved' ? '🌸 構思精巧花' : ''),
      honeyPoints: typeof sub.honeyPoints === 'number' ? sub.honeyPoints : (sub.status === 'approved' ? 2 : 0),
      reviewedAt: sub.reviewedAt || (sub.status === 'approved' ? (sub.timestamp || Date.now()) : null),
      isPublishedToStory: !!sub.isPublishedToStory,
      isPublishedToParent: sub.isPublishedToParent !== undefined ? !!sub.isPublishedToParent : (sub.status === 'approved'),
      parentLikes: typeof sub.parentLikes === 'number' ? sub.parentLikes : 0,
      revisionNote: sub.revisionNote || ''
    };
  }

  // Get all submissions across activities, with optional classId and studentId filters
  getAllSubmissions(classId = null, studentId = null) {
    const targetClassId = classId || this.state.activeClassId;
    const acts = (this.state.portfolios || []).filter(a => !targetClassId || a.classId === targetClassId);

    let allSubs = [];
    acts.forEach(act => {
      (act.submissions || []).forEach(sub => {
        allSubs.push(this.adaptSubmission(sub, act));
      });
    });

    if (studentId) {
      allSubs = allSubs.filter(s => s.studentId === studentId);
    }

    return allSubs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  // Create student portfolio work
  createPortfolioWork({
    classId,
    studentId,
    studentName,
    title = '',
    typeTag = 'drawing',
    outcomeText = '',
    reflection = '',
    mediaData = '',
    activityId = null
  }) {
    const targetClassId = classId || this.state.activeClassId;
    if (!Array.isArray(this.state.portfolios)) this.state.portfolios = [];

    // Find or create target activity
    let act = activityId ? this.state.portfolios.find(a => a.id === activityId) : null;
    if (!act) {
      act = this.state.portfolios.find(a => a.classId === targetClassId);
      if (!act) {
        act = {
          id: `act_${Date.now()}`,
          classId: targetClassId,
          title: '蜂巢課堂個人數位作品集',
          description: '自主學習、手繪創作與探究反思專區',
          type: 'mixed',
          submissions: []
        };
        this.state.portfolios.unshift(act);
      }
    }

    if (!Array.isArray(act.submissions)) act.submissions = [];

    const newSub = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      classId: targetClassId,
      activityId: act.id,
      studentId,
      studentName,
      title: (title || '').trim() || '我的蜂巢學習作品',
      typeTag: typeTag || 'drawing',
      outcomeText: (outcomeText || '').trim(),
      reflection: (reflection || '').trim(),
      mediaUrl: mediaData || '',
      drawingData: mediaData || '',
      caption: (outcomeText || '').trim() || (title || '').trim(),
      status: 'pending',
      timestamp: Date.now(),
      teacherFeedback: '',
      flowerSticker: '',
      honeyPoints: 0,
      reviewedAt: null,
      isPublishedToStory: false,
      isPublishedToParent: false,
      parentLikes: 0,
      revisionNote: ''
    };

    act.submissions.unshift(newSub);
    this.save();
    return newSub;
  }

  // Submit portfolio work (legacy support)
  submitPortfolioWork(activityId, studentId, studentName, type, drawingData, caption) {
    const act = this.state.portfolios ? this.state.portfolios.find(a => a.id === activityId) : null;
    const classId = act ? act.classId : this.state.activeClassId;
    return this.createPortfolioWork({
      classId,
      activityId,
      studentId,
      studentName,
      title: caption || (act ? act.title : '課堂學習成果'),
      typeTag: type || 'drawing',
      outcomeText: caption || '',
      reflection: '',
      mediaData: drawingData
    });
  }

  // Approve portfolio submission with idempotent point awarding
  approvePortfolioSubmission(activityId, submissionId, options = {}) {
    let feedback = '';
    let flowerSticker = '🌸 構思精巧花';
    let points = 2;
    let publishToStory = true;

    // Support legacy positional parameters: (activityId, submissionId, feedback, flowerSticker, publishToStory)
    if (typeof options === 'string') {
      feedback = options;
      if (arguments[3] !== undefined) flowerSticker = arguments[3];
      if (arguments[4] !== undefined) publishToStory = arguments[4];
    } else if (typeof options === 'object' && options !== null) {
      if (options.feedback !== undefined) feedback = options.feedback;
      if (options.flowerSticker !== undefined) flowerSticker = options.flowerSticker;
      if (options.points !== undefined) points = Number(options.points);
      if (options.publishToStory !== undefined) publishToStory = !!options.publishToStory;
    }

    let targetAct = null;
    let targetSub = null;

    if (activityId) {
      targetAct = (this.state.portfolios || []).find(a => a.id === activityId);
      if (targetAct && Array.isArray(targetAct.submissions)) {
        targetSub = targetAct.submissions.find(s => s.id === submissionId);
      }
    }
    if (!targetSub) {
      for (const act of (this.state.portfolios || [])) {
        const sub = (act.submissions || []).find(s => s.id === submissionId);
        if (sub) {
          targetAct = act;
          targetSub = sub;
          break;
        }
      }
    }

    if (!targetSub || !targetAct) return null;

    // Idempotent point awarding: only award points once if status wasn't already approved
    const isAlreadyApproved = targetSub.status === 'approved';

    targetSub.status = 'approved';
    targetSub.teacherFeedback = feedback;
    targetSub.flowerSticker = flowerSticker;
    targetSub.honeyPoints = points;
    targetSub.reviewedAt = Date.now();
    targetSub.isPublishedToParent = true;

    if (!isAlreadyApproved && points > 0) {
      const stickerClean = (flowerSticker || '').replace(/[^\u4e00-\u9fa5]/g, '') || '優秀作品';
      const skill = {
        name: `學習歷程作品 (${stickerClean})`,
        points: points,
        icon: '🎨',
        note: feedback || `在「${targetSub.title || targetAct.title || '作品集'}」展現優異成果`
      };
      this.awardStudentPoint(targetAct.classId, targetSub.studentId, skill);
    }

    if (publishToStory && !targetSub.isPublishedToStory) {
      const content = `🐝 小蜜蜂【${targetSub.studentName}】在作業「${targetAct.title || targetSub.title}」發布了精彩作品《${targetSub.title}》！\n${targetSub.outcomeText ? '「' + targetSub.outcomeText + '」\n' : (targetSub.caption ? '「' + targetSub.caption + '」\n' : '')}${flowerSticker} 導師評語：${feedback || '構思生動用心，值得全班表揚！'}`;
      this.addStoryPost(targetAct.classId, '林老師', content, targetSub.mediaUrl || targetSub.drawingData);
      targetSub.isPublishedToStory = true;
    }

    this.save();
    return targetSub;
  }

  // Return portfolio submission for revision
  returnPortfolioSubmission(activityId, submissionId, revisionNote = '') {
    let targetAct = null;
    let targetSub = null;

    if (activityId) {
      targetAct = (this.state.portfolios || []).find(a => a.id === activityId);
      if (targetAct && Array.isArray(targetAct.submissions)) {
        targetSub = targetAct.submissions.find(s => s.id === submissionId);
      }
    }
    if (!targetSub) {
      for (const act of (this.state.portfolios || [])) {
        const sub = (act.submissions || []).find(s => s.id === submissionId);
        if (sub) {
          targetAct = act;
          targetSub = sub;
          break;
        }
      }
    }

    if (!targetSub) return null;

    targetSub.status = 'needs_revision';
    targetSub.revisionNote = revisionNote || '作品很有潛力！請根據老師的建議稍微補充細節喔！';
    targetSub.reviewedAt = Date.now();
    this.save();
    return targetSub;
  }

  // Like portfolio submission
  likePortfolioSubmission(submissionId) {
    for (const act of (this.state.portfolios || [])) {
      const sub = (act.submissions || []).find(s => s.id === submissionId);
      if (sub) {
        sub.parentLikes = (sub.parentLikes || 0) + 1;
        this.save();
        return sub.parentLikes;
      }
    }
    return 0;
  }

  // Add new portfolio activity
  addPortfolioActivity(classId, title, description, type = 'drawing') {
    const targetClassId = classId || this.state.activeClassId;
    if (!Array.isArray(this.state.portfolios)) this.state.portfolios = [];
    const newAct = {
      id: `act_${Date.now()}`,
      classId: targetClassId,
      title: (title || '').trim() || '新課堂作業活動',
      description: (description || '').trim(),
      type: type || 'drawing',
      submissions: [],
      createdAt: Date.now()
    };
    this.state.portfolios.unshift(newAct);
    this.save();
    return newAct;
  }

  // Reset to demo data
  resetDemoData() {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save();
  }

  // Security: Salted Web Crypto verification
  async verifyUserLogin(username, password) {
    if (!this.state.currentUser) return false;
    if (this.state.currentUser.username !== username) return false;
    const storedHash = this.state.currentUser.passwordHash || 'a4b2c7a2217be305973615237f9b904a62b9b032b9c8bd9c069f3258dbf0ad0c';
    const salt = this.state.currentUser.salt || 'crew_salt_2026';
    return await verifyPassword(password, storedHash, salt);
  }

  // Quota & Storage health check
  getStorageQuota() {
    return StorageQuotaManager.getUsage();
  }
}

export const store = new DojoStore();
export { escapeHTML, escapeHTML as escapeHtml, maskSensitiveCode, StorageQuotaManager, DatabaseQuotaGuard };

if (typeof window !== 'undefined') {
  window.escapeHTML = escapeHTML;
  window.escapeHtml = escapeHTML;
  window.maskSensitiveCode = maskSensitiveCode;
}
