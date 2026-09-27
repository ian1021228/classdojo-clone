/**
 * ClassDojo Reward Store & Points Redemption Engine
 * Enables students to redeem privileges using hard-earned points and teachers to approve redemptions.
 */

import { store } from './store.js';

export const DEFAULT_REWARDS = [
  { id: 'rew_leader', title: '👑 蜂王小隊長領航特權', points: 10, icon: '👑', desc: '整天擔任蜂巢領航小隊長，協助整隊、收發作業與帶領早自習！' },
  { id: 'rew_seat', title: '🌻 挑選陽光花園座位一週', points: 15, icon: '🌻', desc: '可自由挑選心儀的學習座位一整週，與好蜂友同心探究！' },
  { id: 'rew_tea', title: '🍯 導師特調蜜茶甜心時光', points: 25, icon: '🍯', desc: '週五午餐後與導師享用純蜜茶點，暢聊心事與生活趣事！' },
  { id: 'rew_dj', title: '🎧 蜂巢專注輕音樂點播權', points: 12, icon: '🎧', desc: '自習時間可為全班挑選一首喜愛的自然花園專注純音樂！' },
  { id: 'rew_art', title: '🎨 蜂巢壁報首席插畫家', points: 8, icon: '🎨', desc: '擔任美術課用具發放組長，作品優先陳列在蜂巢榮譽花園！' },
  { id: 'rew_chore', title: '✨ 免除值日生責任一次券', points: 15, icon: '✨', desc: '獲得免除一次值日生責任券，由小隊熱心夥伴支援！' }
];

class RewardStore {
  constructor() {
    this.rewards = DEFAULT_REWARDS;
    this.redemptions = [];
  }

  getRewards() {
    return this.rewards;
  }

  getRedemptions(studentId = null) {
    if (studentId) {
      return this.redemptions.filter(r => r.studentId === studentId);
    }
    return this.redemptions;
  }

  // Student redeems reward
  redeem(studentId, rewardId) {
    const cls = store.getActiveClass();
    const student = cls.students.find(s => s.id === studentId);
    const reward = this.rewards.find(r => r.id === rewardId);

    if (!student || !reward) return { success: false, message: '查無學生或獎勵項目' };
    if (student.points < reward.points) {
      return { success: false, message: `點數不足！尚需 ${reward.points - student.points} 點` };
    }

    student.points -= reward.points;
    const redemption = {
      id: `rdm_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      rewardId: reward.id,
      rewardTitle: reward.title,
      rewardIcon: reward.icon,
      pointsSpent: reward.points,
      status: 'approved', // instant pass or teacher review
      timestamp: Date.now()
    };

    this.redemptions.unshift(redemption);
    student.history.unshift({
      id: `h_rew_${Date.now()}`,
      skillName: `[兌換獎勵] ${reward.title}`,
      points: -reward.points,
      type: 'rew',
      icon: reward.icon,
      timestamp: Date.now(),
      note: `成功兌換：${reward.title}`
    });

    store.save();
    return { success: true, redemption };
  }

  // Teacher adds new reward
  addReward(title, points, icon = '🎁', desc = '') {
    const newRew = { id: `rew_${Date.now()}`, title, points, icon, desc };
    this.rewards.push(newRew);
    return newRew;
  }
}

export const rewardStore = new RewardStore();
