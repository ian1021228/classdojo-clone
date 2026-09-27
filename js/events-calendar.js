/**
 * ClassDojo Calendar & Events Manager
 * Implements classroom events, field trips, RSVPs, and countdown reminders.
 */

export const INITIAL_EVENTS = [
  {
    id: 'evt_1',
    title: '🚀 水火箭科學探究大賽',
    date: '2026-10-02',
    time: '14:00 - 15:30',
    location: '學校大操場',
    description: '每組同學將發射親手組裝的水火箭，請穿著輕便運動服裝並自備毛巾。',
    rsvpCount: 5,
    isRSVPed: true
  },
  {
    id: 'evt_2',
    title: '🔭 秋季天文科學館戶外教學',
    date: '2026-10-12',
    time: '08:30 - 16:00',
    location: '台北市立天文科學教育館',
    description: '探索太陽系行星軌道與星座故事，請攜帶悠遊卡與便當水壺。',
    rsvpCount: 5,
    isRSVPed: false
  },
  {
    id: 'evt_3',
    title: '🎃 萬聖節怪獸變裝派對',
    date: '2026-10-31',
    time: '10:00 - 12:00',
    location: '三年甲班 快樂冒險家教室',
    description: '孩子們將化身為自己在 ClassDojo 設計的怪獸造型，一同分享糖果與英文字彙遊戲！',
    rsvpCount: 4,
    isRSVPed: false
  },
  {
    id: 'evt_4',
    title: '👨‍👩‍👧 親職座談與學習成果發表會',
    date: '2026-11-15',
    time: '09:30 - 11:30',
    location: '學校大禮堂',
    description: '展示學生本學期學習歷程手繪創作、Dojo 成長點數勳章與家長深度座談交流。',
    rsvpCount: 5,
    isRSVPed: true
  }
];

class CalendarManager {
  constructor() {
    this.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
  }

  getEvents() {
    return this.events;
  }

  addEvent(title, date, time, location, description) {
    const evt = {
      id: `evt_${Date.now()}`,
      title,
      date,
      time,
      location,
      description,
      rsvpCount: 1,
      isRSVPed: false
    };
    this.events.unshift(evt);
    return evt;
  }

  toggleRSVP(eventId) {
    const evt = this.events.find(e => e.id === eventId);
    if (!evt) return;
    evt.isRSVPed = !evt.isRSVPed;
    evt.rsvpCount += evt.isRSVPed ? 1 : -1;
    return evt;
  }
}

export const calendarManager = new CalendarManager();
