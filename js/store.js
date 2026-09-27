/**
 * ClassDojo Central Reactive Data Store
 * Manages classes, students, feedback points, attendance, stories, messages, and portfolios.
 * Supports isolated dual-mode persistence (Firestore + LocalStorage).
 */

import { dataEngine } from './firebase-config.js';

// Pre-seeded Rich Demo Data
const INITIAL_DATA = {
  activeClassId: 'cls_demo_class',
  currentUser: {
    role: 'teacher', // 'teacher' | 'student' | 'parent'
    username: 'antigravity',
    displayName: '王 老師 (Daniel Christian Academy)',
    activeStudentId: 'stu_demo_1'
  },
  classes: [
    {
      id: 'cls_demo_class',
      name: 'Demo Class',
      school: 'Daniel Christian Academy',
      grade: '示範班級',
      icon: '📙',
      code: 'DEMO88',
      totalPoints: 5,
      skills: {
        positive: [
          { id: 'pos_help', name: 'Helping others', points: 1, icon: '🤝' },
          { id: 'pos_ontask', name: 'On task', points: 1, icon: '🎯' },
          { id: 'pos_part', name: 'Participating', points: 1, icon: '🙋' },
          { id: 'pos_persist', name: 'Persistence', points: 1, icon: '🧗' },
          { id: 'pos_team', name: 'Teamwork', points: 1, icon: '🧩' },
          { id: 'pos_hard', name: 'Working hard', points: 1, icon: '⭐' }
        ],
        needsWork: [
          { id: 'neg_offtask', name: 'Off task', points: -1, icon: '⏳' },
          { id: 'neg_talk', name: 'Talking out of turn', points: -1, icon: '🗣️' },
          { id: 'neg_disrespect', name: 'Disrespect', points: -1, icon: '🙅' },
          { id: 'neg_nohw', name: 'No homework', points: -1, icon: '📝' },
          { id: 'neg_unprepared', name: 'Unprepared', points: -1, icon: '🎒' }
        ]
      },
      students: [
        {
          id: 'stu_demo_1',
          name: 'Beyoncé',
          seatNumber: 1,
          points: 1,
          isHatched: false,
          seed: 'Beyoncé_Egg1',
          attendance: 'present',
          parentName: 'Beyoncé 家長',
          parentCode: 'P-BEY01',
          history: [{ id: 'hd1', skillName: 'Helping others', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '主動熱心助人' }]
        },
        {
          id: 'stu_demo_2',
          name: 'Denzel',
          seatNumber: 2,
          points: 1,
          isHatched: false,
          seed: 'Denzel_Egg2',
          attendance: 'present',
          parentName: 'Denzel 家長',
          parentCode: 'P-DEN02',
          history: [{ id: 'hd2', skillName: 'On task', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '專注課堂學習' }]
        },
        {
          id: 'stu_demo_3',
          name: 'Jennifer',
          seatNumber: 3,
          points: 1,
          isHatched: false,
          seed: 'Jennifer_Egg3',
          attendance: 'present',
          parentName: 'Jennifer 家長',
          parentCode: 'P-JEN03',
          history: [{ id: 'hd3', skillName: 'Participating', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '積極發言回答' }]
        },
        {
          id: 'stu_demo_4',
          name: 'Justin',
          seatNumber: 4,
          points: 1,
          isHatched: false,
          seed: 'Justin_Egg4',
          attendance: 'present',
          parentName: 'Justin 家長',
          parentCode: 'P-JUS04',
          history: [{ id: 'hd4', skillName: 'Persistence', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '堅持解題挑戰' }]
        },
        {
          id: 'stu_demo_5',
          name: 'Leonardo',
          seatNumber: 5,
          points: 1,
          isHatched: false,
          seed: 'Leonardo_Egg5',
          attendance: 'present',
          parentName: 'Leonardo 家長',
          parentCode: 'P-LEO05',
          history: [{ id: 'hd5', skillName: 'Working hard', points: 1, type: 'pos', timestamp: Date.now() - 3600000, note: '課堂認真努力' }]
        }
      ],
      groups: [
        { id: 'grp_demo_1', name: '⭐ Star Group', studentIds: ['stu_demo_1', 'stu_demo_2'], points: 2 },
        { id: 'grp_demo_2', name: '🚀 Rocket Group', studentIds: ['stu_demo_3', 'stu_demo_4', 'stu_demo_5'], points: 3 }
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
      classId: 'cls_dojo_1',
      timestamp: Date.now() - 7200000,
      content: '🌟 今天的自然科學實驗課，大家熱烈討論了浮力原理，每位同學都積極動手實作小船，在水盆測試中互助合作，全班氣氛超棒！為大家的探究精神喝采！👏🚢✨',
      image: '',
      likes: 12,
      liked: false,
      comments: [
        { id: 'c1', author: '王媽媽', text: '小明回家後還在水槽做測試，太有熱情了！謝謝老師引導 ❤️', time: '1 小時前' },
        { id: 'c2', author: '陳爸爸', text: '看到孩子們開心的笑容真棒，謝謝老師！', time: '30 分鐘前' }
      ]
    },
    {
      id: 'post_2',
      author: '林老師 (Teacher Lin)',
      classId: 'cls_dojo_1',
      timestamp: Date.now() - 86400000,
      content: '📢【週五戶外教學提醒】親愛的家長您好，本週五為天文科學館參訪日，請孩子穿著運動服裝、攜帶水壺與輕便背包，期待和大家一起探索浩瀚星空！🔭🌌',
      image: '',
      likes: 18,
      liked: true,
      comments: [
        { id: 'c3', author: '周媽媽', text: '收到通知，當天會幫芷瑄準備溫開水！', time: '昨天' }
      ]
    }
  ],
  messages: {
    'stu_1': [
      { id: 'm1', sender: 'teacher', text: '王媽媽您好！小明今天在課堂上表現非常出色，主動幫同學講解題目，特別頒發了 2 點 Dojo 點數鼓勵喔！', timestamp: Date.now() - 18000000 },
      { id: 'm2', sender: 'parent', text: '謝謝林老師的用心鼓勵！小明回到家一直好開心地展示他的怪獸勳章，我們會繼續支持他！', timestamp: Date.now() - 14400000 },
      { id: 'm3', sender: 'teacher', text: '不客氣！小明的善良與耐心是全班的榜樣，有任何事情隨時和我聯絡喔！😊', timestamp: Date.now() - 10800000 }
    ],
    'stu_2': [
      { id: 'm4', sender: 'teacher', text: '陳爸爸您好，Emma 今天美術創作非常有創意，作品已經收錄在學習歷程檔案中！', timestamp: Date.now() - 36000000 },
      { id: 'm5', sender: 'parent', text: '太好了，我們剛剛在手機端看到作品了，畫得真生動！謝謝老師！', timestamp: Date.now() - 28800000 }
    ]
  },
  portfolios: [
    {
      id: 'act_1',
      classId: 'cls_dojo_1',
      title: '週末怪獸好朋友手繪創作',
      description: '用畫板繪製出你心目中的怪獸好朋友，並為他取一個響亮的名字！',
      submissions: [
        {
          id: 'sub_1',
          studentId: 'stu_1',
          studentName: '王小明 (Leo)',
          type: 'drawing',
          drawingData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23f0fdf4"/><circle cx="150" cy="100" r="50" fill="%2300d27a"/><circle cx="135" cy="90" r="10" fill="%23fff"/><circle cx="165" cy="90" r="10" fill="%23fff"/><circle cx="137" cy="90" r="5" fill="%232b3b48"/><circle cx="167" cy="90" r="5" fill="%232b3b48"/><path d="M 135 115 Q 150 135 165 115" stroke="%232b3b48" stroke-width="4" fill="none"/></svg>',
          caption: '這是我設計的綠波波怪獸，他有一雙超大眼睛，最喜歡吃巧克力餅乾！🍪',
          status: 'approved',
          timestamp: Date.now() - 43200000
        },
        {
          id: 'sub_2',
          studentId: 'stu_2',
          studentName: '陳小華 (Emma)',
          type: 'drawing',
          drawingData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23fdf2f8"/><circle cx="150" cy="100" r="55" fill="%23ff006e"/><circle cx="150" cy="85" r="12" fill="%23fff"/><circle cx="152" cy="85" r="6" fill="%232b3b48"/><path d="M 135 115 Q 150 130 165 115" stroke="%232b3b48" stroke-width="4" fill="none"/></svg>',
          caption: '粉紅獨眼小精靈，她的頭頂會發光指引夜路！✨',
          status: 'pending',
          timestamp: Date.now() - 7200000
        }
      ]
    }
  ]
};

class DojoStore {
  constructor() {
    this.state = dataEngine.loadState(INITIAL_DATA);
    // Ensure all critical properties exist
    if (!this.state.classes || !this.state.classes.length) {
      this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
      dataEngine.saveState(this.state);
    }
    // Listen for storage changes from other tabs or firebase
    window.addEventListener('storage', (e) => {
      if (e.key === dataEngine.storageKey) {
        this.state = dataEngine.loadState(INITIAL_DATA);
        this.notify();
      }
    });
    this.subscribers = new Set();
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
    this.save();
    return cls;
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
  addStoryPost(classId, author, content, image = '') {
    const post = {
      id: `post_${Date.now()}`,
      author,
      classId,
      timestamp: Date.now(),
      content,
      image,
      likes: 0,
      liked: false,
      comments: []
    };
    this.state.stories.unshift(post);
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

  // Submit portfolio work
  submitPortfolioWork(activityId, studentId, studentName, type, drawingData, caption) {
    const act = this.state.portfolios.find(a => a.id === activityId);
    if (!act) return;
    const sub = {
      id: `sub_${Date.now()}`,
      studentId,
      studentName,
      type,
      drawingData,
      caption,
      status: 'pending',
      timestamp: Date.now()
    };
    act.submissions.unshift(sub);
    this.save();
    return sub;
  }

  // Approve portfolio submission
  approvePortfolioSubmission(activityId, submissionId) {
    const act = this.state.portfolios.find(a => a.id === activityId);
    if (!act) return;
    const sub = act.submissions.find(s => s.id === submissionId);
    if (sub) {
      sub.status = 'approved';
      this.save();
    }
  }

  // Reset to demo data
  resetDemoData() {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.save();
  }
}

export const store = new DojoStore();
