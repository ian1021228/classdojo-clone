/**
 * ClassDojo Big Ideas - Social-Emotional Learning (SEL) Video Theater
 * Features Mojo & Katie growth mindset animated lessons, discussion guides, and reflection badges.
 */

export const BIG_IDEAS_SERIES = [
  {
    id: 'sel_1',
    series: '成長心態 (Growth Mindset)',
    title: '第一集：「還沒」的強大力量 (The Power of Yet)',
    character: 'Mojo & Katie',
    icon: '🌱',
    themeColor: '#00af66',
    duration: '3 分鐘',
    summary: 'Mojo 遇到了一道超難的難題，一度想要放棄並認為自己「不夠聰明」。直到好朋友 Katie 告訴他成長的終極魔法秘訣——只要在句子後面加上「還沒 (Yet)」，一切都有可能！',
    keyTakeaway: '「失敗不是終點，而是學習正在發生的證明！」',
    questions: [
      '當遇到困難的挑戰時，你心裡的聲音通常會說些什麼？',
      '試著將「我不會做這題」改成「我還沒學會做這題」，心情有什麼不同？',
      '在今天的課堂中，有哪一件事是你想用「還沒」去征服的？'
    ]
  },
  {
    id: 'sel_2',
    series: '大腦科學 (Brain Science)',
    title: '第二集：大腦肌肉大冒險 (The Mysterious Neurons)',
    character: 'Mojo',
    icon: '🧠',
    themeColor: '#3a86ff',
    duration: '4 分鐘',
    summary: '你知道我們的大腦神經元就像身體的肌肉一樣嗎？當你練習困難的事物並嘗試修正常見錯誤時，神經連結就會長得更加粗壯敏捷！',
    keyTakeaway: '「每一次努力思考，大腦都在悄悄變大變強壯！」',
    questions: [
      '你上次覺得大腦在「流汗」是什麼時候？',
      '為什麼練習困難的事情比做簡單熟悉的事情更能讓大腦升級？'
    ]
  },
  {
    id: 'sel_3',
    series: '正念與專注 (Mindfulness)',
    title: '第三集：安靜呼吸的魔法泡泡 (Breathe with Mojo)',
    character: 'Katie & Mojo',
    icon: '🫧',
    themeColor: '#8338ec',
    duration: '2 分鐘',
    summary: '當課堂氣氛有些浮躁或心情緊張時，跟隨 Mojo 一起進行 3 次深呼吸，把注意力帶回當下，找回心中的寧靜與力量。',
    keyTakeaway: '「深呼吸，讓心靈像平靜的湖水一樣清澈。」',
    questions: [
      '在深呼吸 3 次後，你的身體和肩膀有什麼感覺？',
      '在考試或上台報告前，深呼吸如何幫助你保持自信？'
    ]
  }
];

class BigIdeasManager {
  constructor() {
    this.episodes = BIG_IDEAS_SERIES;
    this.activeEpisode = BIG_IDEAS_SERIES[0];
  }

  getEpisodes() {
    return this.episodes;
  }

  getEpisode(id) {
    return this.episodes.find(e => e.id === id) || this.episodes[0];
  }
}

export const bigIdeasManager = new BigIdeasManager();
