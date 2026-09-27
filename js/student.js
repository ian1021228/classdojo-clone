/**
 * ClassDojo Student Portal Controller
 * Implements monster avatar customizer, egg hatching, points summary, HTML5 drawing pad, and portfolio submissions.
 */

import { store } from './store.js';

class StudentController {
  constructor() {
    this.activeClass = store.getActiveClass();
    this.currentStudentId = this.activeClass.students[0]?.id || 'stu_1';
    this.currentTab = 'monster'; // 'monster' | 'points' | 'portfolio' | 'story'

    // Monster customizer active traits
    this.traits = {
      colorIdx: 0,
      bodyShape: 'round',
      eyeStyle: 'two_big',
      mouthStyle: 'smile',
      accessory: 'party_hat'
    };

    // Drawing Pad State
    this.isDrawing = false;
    this.drawColor = '#00d27a';
    this.brushSize = 7;
    this.canvas = null;
    this.ctx = null;

    this.init();
  }

  init() {
    this.bindDOMElements();
    this.initDrawingCanvas();
    this.bindEvents();
    this.loadCurrentStudent();
    this.renderCustomizerOptions();
    this.renderAll();

    // Store subscription
    store.subscribe(() => {
      this.activeClass = store.getActiveClass();
      this.renderAll();
    });
  }

  bindDOMElements() {
    this.studentSelect = document.getElementById('student-picker-select');
    this.tabMonster = document.getElementById('tab-student-monster');
    this.tabPoints = document.getElementById('tab-student-points');
    this.tabPortfolio = document.getElementById('tab-student-portfolio');
    this.tabStory = document.getElementById('tab-student-story');

    this.viewMonster = document.getElementById('view-student-monster');
    this.viewPoints = document.getElementById('view-student-points');
    this.viewPortfolio = document.getElementById('view-student-portfolio');
    this.viewStory = document.getElementById('view-student-story');

    this.livePreviewWrap = document.getElementById('monster-live-preview');
    this.previewNameTag = document.getElementById('preview-student-name');
    this.hatchActionWrap = document.getElementById('hatch-action-wrap');

    // Drawing Pad Elements
    this.canvas = document.getElementById('drawing-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
  }

  bindEvents() {
    // Student switcher dropdown
    this.studentSelect.addEventListener('change', (e) => {
      this.currentStudentId = e.target.value;
      this.loadCurrentStudent();
      this.renderAll();
    });

    // Navigation Tabs
    this.tabMonster.addEventListener('click', () => this.switchTab('monster'));
    this.tabPoints.addEventListener('click', () => this.switchTab('points'));
    this.tabPortfolio.addEventListener('click', () => this.switchTab('portfolio'));
    this.tabStory.addEventListener('click', () => this.switchTab('story'));

    // Mobile nav items
    document.getElementById('mob-stu-monster')?.addEventListener('click', () => this.switchTab('monster'));
    document.getElementById('mob-stu-points')?.addEventListener('click', () => this.switchTab('points'));
    document.getElementById('mob-stu-portfolio')?.addEventListener('click', () => this.switchTab('portfolio'));
    document.getElementById('mob-stu-story')?.addEventListener('click', () => this.switchTab('story'));

    // Save Monster Button
    document.getElementById('btn-save-monster')?.addEventListener('click', () => {
      const cls = store.getActiveClass();
      store.updateStudentMonster(cls.id, this.currentStudentId, this.traits);
      if (window.dojoAudio) window.dojoAudio.playPositive();
      if (window.dojoConfetti) window.dojoConfetti.burst();
      alert('🎉 專屬怪獸頭像已成功儲存！班導師與全班同學都能看見你的新造型！');
    });

    // Drawing Pad Events
    this.setupDrawingEvents();

    // Submit Drawing Button
    document.getElementById('btn-submit-drawing')?.addEventListener('click', () => {
      const captionInput = document.getElementById('drawing-caption');
      const caption = captionInput.value.trim() || '我的怪獸好朋友手繪創作';
      const dataUrl = this.canvas.toDataURL('image/png');

      const s = this.getStudent();
      const act = store.state.portfolios[0];
      if (act && s) {
        store.submitPortfolioWork(act.id, s.id, s.name, 'drawing', dataUrl, caption);
        captionInput.value = '';
        this.clearCanvas();
        if (window.dojoAudio) window.dojoAudio.playPositive();
        if (window.dojoConfetti) window.dojoConfetti.burst();
        alert('🚀 手繪作品已送出！請等待老師審核通過並頒發點數！');
        this.renderPortfolioSubmissions();
      }
    });

    // Clear Canvas Button
    document.getElementById('btn-clear-canvas')?.addEventListener('click', () => this.clearCanvas());
  }

  getStudent() {
    return this.activeClass.students.find(s => s.id === this.currentStudentId) || this.activeClass.students[0];
  }

  loadCurrentStudent() {
    const s = this.getStudent();
    if (!s) return;
    this.previewNameTag.textContent = s.name;

    if (s.isHatched && s.monster) {
      this.traits = JSON.parse(JSON.stringify(s.monster));
    } else {
      // Default initial traits
      this.traits = {
        colorIdx: Math.floor(Math.random() * 8),
        bodyShape: 'round',
        eyeStyle: 'two_big',
        mouthStyle: 'smile',
        accessory: 'horns'
      };
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    [this.tabMonster, this.tabPoints, this.tabPortfolio, this.tabStory].forEach(t => t.classList.remove('active'));
    [this.viewMonster, this.viewPoints, this.viewPortfolio, this.viewStory].forEach(v => v.style.display = 'none');

    document.querySelectorAll('.mobile-bottom-bar .mobile-nav-item').forEach(m => m.classList.remove('active'));

    if (tabName === 'monster') {
      this.tabMonster.classList.add('active');
      document.getElementById('mob-stu-monster')?.classList.add('active');
      this.viewMonster.style.display = 'block';
    } else if (tabName === 'points') {
      this.tabPoints.classList.add('active');
      document.getElementById('mob-stu-points')?.classList.add('active');
      this.viewPoints.style.display = 'block';
      this.renderPointsTab();
    } else if (tabName === 'portfolio') {
      this.tabPortfolio.classList.add('active');
      document.getElementById('mob-stu-portfolio')?.classList.add('active');
      this.viewPortfolio.style.display = 'block';
      this.renderPortfolioSubmissions();
    } else if (tabName === 'story') {
      this.tabStory.classList.add('active');
      document.getElementById('mob-stu-story')?.classList.add('active');
      this.viewStory.style.display = 'block';
      this.renderStoriesTab();
    }
  }

  renderAll() {
    this.renderStudentDropdown();
    this.renderPreview();
    if (this.currentTab === 'points') this.renderPointsTab();
    if (this.currentTab === 'portfolio') this.renderPortfolioSubmissions();
    if (this.currentTab === 'story') this.renderStoriesTab();
  }

  renderStudentDropdown() {
    this.studentSelect.innerHTML = this.activeClass.students.map(s => `
      <option value="${s.id}" ${s.id === this.currentStudentId ? 'selected' : ''}>
        ${s.isHatched ? '👾' : '🥚'} ${s.name} (${s.points} 點)
      </option>
    `).join('');
  }

  renderPreview() {
    const s = this.getStudent();
    if (!s) return;

    if (!s.isHatched) {
      // Unhatched egg mode
      this.livePreviewWrap.innerHTML = window.monsterEngine ? window.monsterEngine.renderEgg(s.name, 160) : '';
      this.hatchActionWrap.innerHTML = `
        <button class="btn btn-primary btn-lg" id="btn-hatch-egg" style="background: linear-gradient(135deg, #00af66 0%, #3a86ff 100%);">
          🐣 立即孵化我的專屬怪獸！
        </button>
      `;

      document.getElementById('btn-hatch-egg')?.addEventListener('click', () => {
        store.updateStudentMonster(this.activeClass.id, s.id, this.traits);
        if (window.dojoAudio) window.dojoAudio.playFanfare();
        if (window.dojoConfetti) window.dojoConfetti.burst(null, null, 80);
        this.renderAll();
      });
    } else {
      // Hatched monster mode
      this.livePreviewWrap.innerHTML = window.monsterEngine ? window.monsterEngine.render(this.traits, 160) : '';
      this.hatchActionWrap.innerHTML = `
        <span style="background: #e6f9f0; color: #00af66; font-weight: 700; padding: 6px 16px; border-radius: var(--radius-full); font-size: 0.9rem;">
          ✨ 已孵化成功
        </span>
      `;
    }
  }

  renderCustomizerOptions() {
    const me = window.monsterEngine;
    if (!me) return;

    // 1. Swatches
    const swatchesWrap = document.getElementById('swatches-container');
    swatchesWrap.innerHTML = me.colors.map((c, idx) => `
      <button class="color-swatch-btn ${idx === this.traits.colorIdx ? 'selected' : ''}" data-color-idx="${idx}" style="background: ${c.main};" title="${c.name}"></button>
    `).join('');

    swatchesWrap.querySelectorAll('.color-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        swatchesWrap.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.traits.colorIdx = parseInt(btn.dataset.colorIdx, 10);
        this.traits.color = me.colors[this.traits.colorIdx];
        if (window.dojoAudio) window.dojoAudio.playTick();
        this.renderPreview();
      });
    });

    // 2. Body Shapes
    const bodyLabels = { round: '圓滾滾', pear: '水滴梨形', tall: '高個子', blob: '果凍波波', fluffy: '毛茸茸' };
    this.setupTraitPills('body-shapes-container', me.bodyShapes, bodyLabels, 'bodyShape');

    // 3. Eye Styles
    const eyeLabels = { two_big: '雙圓大眼', cyclops: '俏皮獨眼', three_eyes: '三眼神童', sleepy: '瞇瞇眼', happy: '微笑眼' };
    this.setupTraitPills('eye-styles-container', me.eyeStyles, eyeLabels, 'eyeStyle');

    // 4. Mouth Styles
    const mouthLabels = { smile: '大微笑', grin_teeth: '露出皓齒', tongue: '吐舌搞怪', cute_open: '圓圓驚訝', vampire: '小尖牙' };
    this.setupTraitPills('mouth-styles-container', me.mouthStyles, mouthLabels, 'mouthStyle');

    // 5. Accessories
    const accLabels = { none: '無配件', horns: '小惡魔角', antenna: '外星觸角', ears: '兔兔大耳', party_hat: '派對帽', glasses: '斯文眼鏡', bow: '粉紅蝴蝶結' };
    this.setupTraitPills('accessories-container', me.accessories, accLabels, 'accessory');
  }

  setupTraitPills(containerId, options, labels, traitKey) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;

    wrap.innerHTML = options.map(opt => `
      <button class="trait-pill-btn ${opt === this.traits[traitKey] ? 'selected' : ''}" data-trait-val="${opt}">
        ${labels[opt] || opt}
      </button>
    `).join('');

    wrap.querySelectorAll('.trait-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('.trait-pill-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.traits[traitKey] = btn.dataset.traitVal;
        if (window.dojoAudio) window.dojoAudio.playTick();
        this.renderPreview();
      });
    });
  }

  // Render Points Tab
  renderPointsTab() {
    const s = this.getStudent();
    if (!s) return;

    document.getElementById('student-total-points-badge').textContent = s.points;
    document.getElementById('student-points-title').textContent = `${s.name} (座號 ${s.seatNumber})`;

    const timelineWrap = document.getElementById('student-feedback-timeline');
    if (!s.history || s.history.length === 0) {
      timelineWrap.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">🌱</span>
          新學期剛開始！積極在課堂上發言與互助，累積你的第一枚怪獸點數吧！
        </div>
      `;
      return;
    }

    timelineWrap.innerHTML = s.history.map(item => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8fafc; border-radius: 12px; border-left: 4px solid ${item.points >= 0 ? '#00d27a' : '#ff4d6d'};">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.5rem;">${item.icon || (item.points >= 0 ? '⭐' : '⏳')}</span>
          <div>
            <strong style="font-size: 0.95rem; color: var(--text-main); display: block;">${item.skillName}</strong>
            <small style="color: var(--text-muted);">${item.note || '課堂優異表現肯定'}</small>
          </div>
        </div>
        <div style="font-weight: 800; font-size: 1.1rem; color: ${item.points >= 0 ? 'var(--dojo-primary)' : 'var(--dojo-red)'};">
          ${item.points >= 0 ? '+' + item.points : item.points} 點
        </div>
      </div>
    `).join('');
  }

  // HTML5 Drawing Pad Initialization
  initDrawingCanvas() {
    if (!this.canvas || !this.ctx) return;
    this.clearCanvas();
  }

  clearCanvas() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setupDrawingEvents() {
    if (!this.canvas || !this.ctx) return;

    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      this.isDrawing = true;
      const pos = getPos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.strokeStyle = this.drawColor;
      this.ctx.lineWidth = this.brushSize;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();
    };

    const stopDraw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      this.isDrawing = false;
      this.ctx.closePath();
    };

    // Mouse events
    this.canvas.addEventListener('mousedown', startDraw);
    this.canvas.addEventListener('mousemove', draw);
    this.canvas.addEventListener('mouseup', stopDraw);
    this.canvas.addEventListener('mouseleave', stopDraw);

    // Touch events for mobile 393x852
    this.canvas.addEventListener('touchstart', startDraw, { passive: false });
    this.canvas.addEventListener('touchmove', draw, { passive: false });
    this.canvas.addEventListener('touchend', stopDraw, { passive: false });

    // Drawing palette triggers
    document.querySelectorAll('[data-draw-color]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-draw-color]').forEach(b => b.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        this.drawColor = e.currentTarget.dataset.drawColor;
      });
    });

    document.querySelectorAll('[data-brush-size]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-brush-size]').forEach(b => b.classList.remove('btn-primary'));
        e.currentTarget.classList.add('btn-primary');
        this.brushSize = parseInt(e.currentTarget.dataset.brushSize, 10);
      });
    });
  }

  renderPortfolioSubmissions() {
    const container = document.getElementById('my-submissions-list');
    const s = this.getStudent();
    if (!container || !s) return;

    const act = store.state.portfolios[0];
    const mySubs = act?.submissions.filter(sub => sub.studentId === s.id) || [];

    if (mySubs.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1 / -1; padding: 20px 0;">尚未有提交的作品，趕緊在上方手繪板畫出你的第一份作品吧！</p>`;
      return;
    }

    container.innerHTML = mySubs.map(sub => `
      <div style="border: 1px solid var(--border-light); border-radius: 12px; padding: 12px; background: #fafbfc;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 700; font-size: 0.85rem;">${new Date(sub.timestamp).toLocaleDateString()}</span>
          <span style="font-size: 0.8rem; font-weight: 800; padding: 2px 8px; border-radius: var(--radius-full); ${sub.status === 'approved' ? 'background: #dcfce7; color: #166534;' : 'background: #fef3c7; color: #92400e;'}">
            ${sub.status === 'approved' ? '✅ 老師已審核' : '⏳ 審核中'}
          </span>
        </div>
        <div style="background: white; border-radius: 8px; overflow: hidden; margin-bottom: 8px; text-align: center;">
          <img src="${sub.drawingData}" alt="學生手繪作品" style="max-width: 100%; height: 130px; object-fit: contain;">
        </div>
        <p style="font-size: 0.85rem; color: var(--text-main);">${sub.caption}</p>
      </div>
    `).join('');
  }

  // Render Class Story Feed
  renderStoriesTab() {
    const list = document.getElementById('student-story-posts');
    if (!list) return;

    const posts = store.state.stories.filter(p => p.classId === this.activeClass.id);
    list.innerHTML = posts.map(post => `
      <div class="post-card">
        <div class="post-header">
          <div class="post-avatar">👨‍🏫</div>
          <div class="post-meta">
            <h4>${post.author}</h4>
            <span>課堂公開故事</span>
          </div>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-footer">
          <button class="like-btn ${post.liked ? 'liked' : ''}" data-student-like="${post.id}">
            <span>${post.liked ? '❤️' : '🤍'}</span>
            <span>${post.likes} 個愛心</span>
          </button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-student-like]').forEach(btn => {
      btn.addEventListener('click', () => {
        store.togglePostLike(btn.dataset.studentLike);
        if (window.dojoAudio) window.dojoAudio.playTick();
        this.renderStoriesTab();
      });
    });
  }
}

window.studentController = new StudentController();
