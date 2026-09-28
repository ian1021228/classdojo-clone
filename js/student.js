/**
 * Crew Student Portal Controller
 * Implements Honeybee avatar customizer, honeycomb cell hatching, honey points ledger,
 * Honey Rewards Store redemption, The Meadow 2D canvas exploration, HTML5 drawing pad, and Hive stories.
 */

import { store, escapeHTML, maskSensitiveCode } from './store.js';
import { rewardStore } from './rewards-store.js';
import { DojoIslands } from './dojo-islands.js';

class StudentController {
  constructor() {
    this.activeClass = store.getActiveClass();
    this.currentStudentId = this.activeClass.students[0]?.id || 'stu_1';
    this.currentTab = 'monster'; // 'monster' | 'points' | 'rewards' | 'islands' | 'portfolio' | 'story'

    // Bee customizer active traits
    this.traits = {
      colorIdx: 0,
      bodyShape: 'round',
      accessory: 'none'
    };

    // Drawing Pad State
    this.isDrawing = false;
    this.drawColor = '#f59e0b';
    this.brushSize = 7;
    this.canvas = null;
    this.ctx = null;

    // Islands Engine instance
    this.islandsInstance = null;

    this.init();
  }

  init() {
    // Parse URL params (?id=stu_X&tab=portfolio)
    try {
      const params = new URLSearchParams(window.location.search);
      const paramId = params.get('id');
      if (paramId && this.activeClass.students.some(s => s.id === paramId)) {
        this.currentStudentId = paramId;
      }
      const paramTab = params.get('tab');
      if (paramTab && ['monster', 'points', 'rewards', 'islands', 'portfolio', 'story'].includes(paramTab)) {
        this.currentTab = paramTab;
      }
    } catch (e) {}

    this.bindDOMElements();
    this.initDrawingCanvas();
    this.bindEvents();
    if (this.currentTab !== 'monster') {
      this.switchTab(this.currentTab);
    }
    this.loadCurrentStudent();
    this.renderCustomizerOptions();
    this.renderAll();

    if (window.setupSoundToggle) {
      window.setupSoundToggle();
    }

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
    this.tabRewards = document.getElementById('tab-student-rewards');
    this.tabIslands = document.getElementById('tab-student-islands');
    this.tabPortfolio = document.getElementById('tab-student-portfolio');
    this.tabStory = document.getElementById('tab-student-story');

    this.viewMonster = document.getElementById('view-student-monster');
    this.viewPoints = document.getElementById('view-student-points');
    this.viewRewards = document.getElementById('view-student-rewards');
    this.viewIslands = document.getElementById('view-student-islands');
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
    if (this.studentSelect) {
      this.studentSelect.addEventListener('change', (e) => {
        this.currentStudentId = e.target.value;
        this.loadCurrentStudent();
        this.renderAll();
      });
    }

    // Navigation Tabs
    this.tabMonster?.addEventListener('click', () => this.switchTab('monster'));
    this.tabPoints?.addEventListener('click', () => this.switchTab('points'));
    this.tabRewards?.addEventListener('click', () => this.switchTab('rewards'));
    this.tabIslands?.addEventListener('click', () => this.switchTab('islands'));
    this.tabPortfolio?.addEventListener('click', () => this.switchTab('portfolio'));
    this.tabStory?.addEventListener('click', () => this.switchTab('story'));

    // Mobile nav items
    document.getElementById('mob-stu-monster')?.addEventListener('click', () => this.switchTab('monster'));
    document.getElementById('mob-stu-points')?.addEventListener('click', () => this.switchTab('points'));
    document.getElementById('mob-stu-rewards')?.addEventListener('click', () => this.switchTab('rewards'));
    document.getElementById('mob-stu-portfolio')?.addEventListener('click', () => this.switchTab('portfolio'));

    // Student Class Code Modal Controls
    const codeModal = document.getElementById('student-code-modal');
    const codeInput = document.getElementById('input-student-class-code');
    document.getElementById('btn-enter-class-code')?.addEventListener('click', () => {
      if (codeInput) codeInput.value = '';
      if (codeModal) codeModal.classList.add('open');
      codeInput?.focus();
    });

    const closeCodeModal = () => {
      if (codeModal) codeModal.classList.remove('open');
    };
    document.getElementById('btn-close-student-code')?.addEventListener('click', closeCodeModal);
    document.getElementById('btn-cancel-student-code')?.addEventListener('click', closeCodeModal);

    const submitCode = () => {
      const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
      const matched = store.state.classes.find(c => c.code === code);
      if (matched) {
        store.setActiveClass(matched.id);
        this.activeClass = store.getActiveClass();
        this.currentStudentId = this.activeClass.students[0]?.id || 'stu_1';
        closeCodeModal();
        if (window.dojoAudio) window.dojoAudio.playFanfare();
        if (window.dojoConfetti) window.dojoConfetti.burst();
        alert(`🎉 成功進入「${matched.name}」！趕快自訂你的小蜜蜂吧！`);
        this.loadCurrentStudent();
        this.renderAll();
      } else {
        alert('⚠️ 查無此班級代碼！請確認代碼是否正確（例如 CREW88）。');
      }
    };

    document.getElementById('btn-submit-student-code')?.addEventListener('click', submitCode);

    codeInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitCode();
      }
    });

    // Global Esc key & backdrop click for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeCodeModal();
      }
    });

    codeModal?.addEventListener('click', (e) => {
      if (e.target === codeModal) closeCodeModal();
    });

    // Save Bee Button
    document.getElementById('btn-save-monster')?.addEventListener('click', () => {
      const cls = store.getActiveClass();
      store.updateStudentMonster(cls.id, this.currentStudentId, this.traits);
      if (window.dojoAudio) window.dojoAudio.playPositive();
      if (window.dojoConfetti) window.dojoConfetti.burst();
      alert('🎉 專屬小蜜蜂造型已成功儲存！蜂巢班導師與小蜂隊友都能看見你的全新風采！');
    });

    // Drawing Pad Events
    this.setupDrawingEvents();

    // Submit Drawing Button
    const submitDrawing = () => {
      const captionInput = document.getElementById('drawing-caption');
      const caption = captionInput ? captionInput.value.trim() || '我的小蜜蜂課堂創作' : '我的小蜜蜂課堂創作';
      const dataUrl = this.canvas.toDataURL('image/png');

      const s = this.getStudent();
      const act = store.state.portfolios[0];
      if (act && s) {
        store.submitPortfolioWork(act.id, s.id, s.name, 'drawing', dataUrl, caption);
        if (captionInput) captionInput.value = '';
        this.clearCanvas();
        if (window.dojoAudio) window.dojoAudio.playPositive();
        if (window.dojoConfetti) window.dojoConfetti.burst();
        alert('🚀 小蜜蜂創作已送出！等待蜜糖導師審核通過並頒發花蜜點數！');
        this.renderPortfolioSubmissions();
      }
    };

    document.getElementById('btn-submit-drawing')?.addEventListener('click', submitDrawing);

    document.getElementById('drawing-caption')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitDrawing();
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
    if (this.previewNameTag) this.previewNameTag.textContent = s.name;

    if (s.isHatched && s.monster) {
      this.traits = JSON.parse(JSON.stringify(s.monster));
    } else {
      this.traits = {
        colorIdx: 0,
        bodyShape: 'round',
        accessory: 'none'
      };
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    const tabs = [this.tabMonster, this.tabPoints, this.tabRewards, this.tabIslands, this.tabPortfolio, this.tabStory];
    const views = [this.viewMonster, this.viewPoints, this.viewRewards, this.viewIslands, this.viewPortfolio, this.viewStory];

    tabs.forEach(t => t?.classList.remove('active'));
    views.forEach(v => { if (v) v.style.display = 'none'; });

    document.querySelectorAll('.mobile-bottom-bar .mobile-nav-item').forEach(m => m.classList.remove('active'));

    if (tabName === 'monster') {
      this.tabMonster?.classList.add('active');
      document.getElementById('mob-stu-monster')?.classList.add('active');
      if (this.viewMonster) this.viewMonster.style.display = 'block';
    } else if (tabName === 'points') {
      this.tabPoints?.classList.add('active');
      document.getElementById('mob-stu-points')?.classList.add('active');
      if (this.viewPoints) this.viewPoints.style.display = 'block';
      this.renderPointsTab();
    } else if (tabName === 'rewards') {
      this.tabRewards?.classList.add('active');
      document.getElementById('mob-stu-rewards')?.classList.add('active');
      if (this.viewRewards) this.viewRewards.style.display = 'block';
      this.renderRewardsStore();
    } else if (tabName === 'islands') {
      this.tabIslands?.classList.add('active');
      if (this.viewIslands) this.viewIslands.style.display = 'block';
      this.renderStudentIslands();
    } else if (tabName === 'portfolio') {
      this.tabPortfolio?.classList.add('active');
      document.getElementById('mob-stu-portfolio')?.classList.add('active');
      if (this.viewPortfolio) this.viewPortfolio.style.display = 'block';
      this.renderPortfolioSubmissions();
    } else if (tabName === 'story') {
      this.tabStory?.classList.add('active');
      if (this.viewStory) this.viewStory.style.display = 'block';
      this.renderStoriesTab();
    }
  }

  renderAll() {
    this.renderStudentDropdown();
    this.renderPreview();
    if (this.currentTab === 'points') this.renderPointsTab();
    if (this.currentTab === 'rewards') this.renderRewardsStore();
    if (this.currentTab === 'islands') this.renderStudentIslands();
    if (this.currentTab === 'portfolio') this.renderPortfolioSubmissions();
    if (this.currentTab === 'story') this.renderStoriesTab();
  }

  renderStudentDropdown() {
    if (!this.studentSelect) return;
    this.studentSelect.innerHTML = this.activeClass.students.map(s => `
      <option value="${s.id}" ${s.id === this.currentStudentId ? 'selected' : ''}>
        ${s.isHatched ? '🐝' : '🍯'} ${escapeHTML(s.name)} (${s.points} 滴花蜜)
      </option>
    `).join('');
  }

  renderPreview() {
    const s = this.getStudent();
    if (!s || !this.livePreviewWrap) return;

    if (!s.isHatched) {
      // 3-Stage Egg Cracking Ceremony Mode
      this.eggCrackStep = this.eggCrackStep || 0;
      this.livePreviewWrap.innerHTML = `
        <div class="egg-cracking-container" id="egg-cracking-box" style="cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative;">
          <div class="egg-glow-aura"></div>
          <div id="egg-svg-inner" style="transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
            ${window.monsterEngine ? window.monsterEngine.renderEgg(s.name, 160) : ''}
          </div>
        </div>
      `;

      const stepHints = [
        '🐝 破繭而出！點擊蛋殼開始孵化！',
        '💥 蛋殼出現微小裂痕 (1/3)！再敲擊一次！',
        '⚡ 金光從縫隙透出 (2/3)！最後一擊破繭！'
      ];

      if (this.hatchActionWrap) {
        this.hatchActionWrap.innerHTML = `
          <button class="btn btn-primary btn-lg" id="btn-hatch-egg" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            ${stepHints[this.eggCrackStep] || stepHints[0]}
          </button>
        `;
      }

      const triggerCrack = () => {
        const inner = document.getElementById('egg-svg-inner');
        if (this.eggCrackStep === 0) {
          this.eggCrackStep = 1;
          if (inner) {
            inner.classList.add('egg-wobble');
            setTimeout(() => inner.classList.remove('egg-wobble'), 500);
          }
          if (window.dojoAudio) window.dojoAudio.playTick();
          this.renderPreview();
        } else if (this.eggCrackStep === 1) {
          this.eggCrackStep = 2;
          if (inner) {
            inner.classList.add('egg-wobble');
            setTimeout(() => inner.classList.remove('egg-wobble'), 500);
          }
          if (window.dojoAudio) window.dojoAudio.playPositive();
          this.renderPreview();
        } else {
          // Final Hatch!
          this.eggCrackStep = 0;
          store.updateStudentMonster(this.activeClass.id, s.id, this.traits);
          if (window.dojoAudio) window.dojoAudio.playFanfare();
          if (window.dojoConfetti) window.dojoConfetti.burst(null, null, 90);
          this.renderAll();
        }
      };

      document.getElementById('btn-hatch-egg')?.addEventListener('click', triggerCrack);
      document.getElementById('egg-cracking-box')?.addEventListener('click', triggerCrack);
    } else {
      // Hatched Bee mode
      this.livePreviewWrap.innerHTML = window.monsterEngine ? window.monsterEngine.render(this.traits, 160) : '';
      if (this.hatchActionWrap) {
        this.hatchActionWrap.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: #fef3c7; color: #b45309; font-weight: 700; padding: 6px 16px; border-radius: var(--radius-full); font-size: 0.9rem; border: 1px solid #fde68a;">
              ✨ 已完成破繭採蜜中
            </span>
            <button class="btn btn-secondary btn-sm" id="btn-re-hatch" title="再次體驗破繭儀式" style="border-radius: var(--radius-full);">
              <i class="fa-solid fa-rotate-right"></i> 重新體驗破繭
            </button>
          </div>
        `;

        document.getElementById('btn-re-hatch')?.addEventListener('click', () => {
          s.isHatched = false;
          this.eggCrackStep = 0;
          this.renderPreview();
        });
      }
    }
  }

  renderCustomizerOptions() {
    const me = window.monsterEngine;
    if (!me) return;

    // 1. Swatches
    const swatchesWrap = document.getElementById('swatches-container');
    if (swatchesWrap) {
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
    }

    // 2. Body Shapes / Archetypes
    const bodyLabels = {
      round: '<i class="fa-solid fa-circle" style="color: #f59e0b; margin-right: 4px;"></i> 圓滾萌蜂',
      pear: '<i class="fa-solid fa-droplet" style="color: #eab308; margin-right: 4px;"></i> 水滴勤蜂',
      tall: '<i class="fa-solid fa-arrow-up-long" style="color: #10b981; margin-right: 4px;"></i> 靈動長蜂',
      blob: '<i class="fa-solid fa-shapes" style="color: #0ea5e9; margin-right: 4px;"></i> 胖嘟工蜂',
      fluffy: '<i class="fa-solid fa-cloud" style="color: #ec4899; margin-right: 4px;"></i> 蓬鬆絨蜂'
    };
    this.setupTraitPills('body-shapes-container', me.bodyShapes, bodyLabels, 'bodyShape');

    // 3. Accessories
    const accLabels = {
      none: '<i class="fa-solid fa-ban" style="color: #94a3b8; margin-right: 4px;"></i> 悠閒自然',
      horns: '<i class="fa-solid fa-crown" style="color: #f59e0b; margin-right: 4px;"></i> 蜂王皇冠',
      crown: '<i class="fa-solid fa-crown" style="color: #f59e0b; margin-right: 4px;"></i> 蜂王皇冠',
      antenna: '<i class="fa-solid fa-jar" style="color: #d97706; margin-right: 4px;"></i> 金蜜糖罐',
      honey_pot: '<i class="fa-solid fa-jar" style="color: #d97706; margin-right: 4px;"></i> 金蜜糖罐',
      party_hat: '<i class="fa-solid fa-seedling" style="color: #ec4899; margin-right: 4px;"></i> 櫻花花飾',
      blossom: '<i class="fa-solid fa-seedling" style="color: #ec4899; margin-right: 4px;"></i> 櫻花花飾',
      bow: '<i class="fa-solid fa-sun" style="color: #eab308; margin-right: 4px;"></i> 向日葵',
      sunflower: '<i class="fa-solid fa-sun" style="color: #eab308; margin-right: 4px;"></i> 向日葵',
      ears: '<i class="fa-solid fa-wand-magic-sparkles" style="color: #f59e0b; margin-right: 4px;"></i> 璀璨光芒',
      sparkles: '<i class="fa-solid fa-wand-magic-sparkles" style="color: #f59e0b; margin-right: 4px;"></i> 璀璨光芒',
      glasses: '<i class="fa-solid fa-glasses" style="color: #0ea5e9; margin-right: 4px;"></i> 探險風鏡',
      goggles: '<i class="fa-solid fa-glasses" style="color: #0ea5e9; margin-right: 4px;"></i> 探險風鏡'
    };
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

    const badge = document.getElementById('student-total-points-badge');
    if (badge) badge.textContent = s.points;

    const title = document.getElementById('student-points-title');
    if (title) title.textContent = `${s.name} (座號 ${s.seatNumber})`;

    // Update Bee Level & XP Progress
    if (window.getBeeLevelInfo) {
      const lvl = window.getBeeLevelInfo(s.points);
      const lvlTitle = document.getElementById('student-level-title');
      const lvlXp = document.getElementById('student-level-xp');
      const lvlBar = document.getElementById('student-level-progress-bar');
      const lvlHint = document.getElementById('student-level-hint');

      if (lvlTitle) lvlTitle.textContent = lvl.title;
      if (lvlXp) lvlXp.textContent = lvl.next ? `${s.points} / ${lvl.next} 點` : `${s.points} 點 (已達最高榮譽)`;
      if (lvlBar) lvlBar.style.width = `${lvl.progress}%`;
      if (lvlHint) {
        lvlHint.textContent = lvl.next ? `再收集 ${lvl.nextDiff} 滴蜜糖即可晉升「${lvl.nextTitle}」！` : '🎉 恭喜！你已解鎖最高榮譽「傳奇蜂巢守護者」，向日葵花園的至高驕傲！';
      }
    }

    const timelineWrap = document.getElementById('student-feedback-timeline');
    if (!timelineWrap) return;

    if (!s.history || s.history.length === 0) {
      timelineWrap.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">🌻</span>
          新學期剛開始！積極在蜂巢課堂發言、團隊合作與互助，累積你的第一滴金蜜點數吧！
        </div>
      `;
      return;
    }

    // Render Class Milestone Goal Banner
    const cls = this.activeClass;
    if (cls) {
      const goal = cls.milestoneGoal || { title: '🌻 向日葵花園野餐派對', target: 100, reward: '全班共享甜蜜點心野餐日！' };
      const classTotalPts = cls.students.reduce((sum, st) => sum + Math.max(0, st.points || 0), 0);
      const target = goal.target || 100;
      const pct = Math.min(100, Math.round((classTotalPts / target) * 100));

      const titleEl = document.getElementById('stu-milestone-title');
      const progTextEl = document.getElementById('stu-milestone-progress');
      const barEl = document.getElementById('stu-milestone-bar');
      const hintEl = document.getElementById('stu-milestone-hint');

      if (titleEl) titleEl.textContent = `${cls.name} 全班花蜜大目標：${goal.title}`;
      if (progTextEl) progTextEl.textContent = `${classTotalPts} / ${target} 滴花蜜 (${pct}%)`;
      if (barEl) barEl.style.width = `${pct}%`;
      if (hintEl) hintEl.textContent = `🎯 達成獎勵：${goal.reward}！${pct >= 100 ? '🎉 恭喜已達成！' : `還差 ${target - classTotalPts} 滴花蜜即可解鎖！`}`;
    }

    timelineWrap.innerHTML = s.history.map(item => {
      const isParentCheer = !!item.fromParent;
      const borderColor = isParentCheer ? '#f43f5e' : (item.points >= 0 ? '#f59e0b' : '#ef4444');
      const bg = isParentCheer ? '#fff5f5' : '#fffdf5';
      const borderBox = isParentCheer ? '#fecdd3' : '#fde68a';
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: ${bg}; border-radius: 12px; border-left: 4px solid ${borderColor}; border: 1px solid ${borderBox};">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.5rem;">${item.icon || (item.points >= 0 ? '🍯' : '💨')}</span>
            <div>
              <strong style="font-size: 0.95rem; color: #1e293b; display: block;">
                ${escapeHTML(item.skillName)} ${isParentCheer ? '<span style="font-size: 0.75rem; background: #ffe4e6; color: #e11d48; padding: 2px 8px; border-radius: var(--radius-full); font-weight: 700; margin-left: 6px;">來自爸爸媽媽</span>' : ''}
              </strong>
              <small style="color: #64748b;">${escapeHTML(item.note || '蜂巢課堂優良表現')}</small>
            </div>
          </div>
          <div style="font-weight: 800; font-size: 1.1rem; color: ${isParentCheer ? '#e11d48' : (item.points >= 0 ? '#d97706' : '#ef4444')};">
            ${item.points >= 0 ? '+' + item.points : item.points} 滴花蜜
          </div>
        </div>
      `;
    }).join('');

    // Breakthrough 5: Render 8 Badges Showroom & Streak Pill
    this.renderBadgesShowroom(s);
  }

  // Render 8-Badge Achievement Showroom
  renderBadgesShowroom(s) {
    const wrap = document.getElementById('student-badges-showroom');
    const countTag = document.getElementById('unlocked-badge-count-tag');
    if (!wrap) return;

    const streakPill = document.getElementById('student-streak-pill');
    const navStreakPill = document.getElementById('nav-streak-pill');
    const streakDays = 5; // Duolingo style active streak
    if (streakPill) {
      streakPill.innerHTML = `<i class="fa-solid fa-fire"></i> <span>連續全勤 <strong>${streakDays}</strong> 天</span>`;
    }
    if (navStreakPill) {
      navStreakPill.innerHTML = `<i class="fa-solid fa-fire"></i> <span>${streakDays} 天全勤</span>`;
    }

    const badges = [
      {
        id: 'hatch',
        title: '初生萌蜂',
        desc: '完成破繭孵化，踏入向日葵花園',
        icon: '<i class="fa-solid fa-egg" style="color: #f59e0b;"></i>',
        unlocked: !!s.isHatched,
        progress: s.isHatched ? '已破繭' : '點擊造型工坊孵化'
      },
      {
        id: 'honey_5',
        title: '採蜜小先鋒',
        desc: '累積獲得 5 滴以上花蜜點數',
        icon: '<i class="fa-solid fa-jar" style="color: #d97706;"></i>',
        unlocked: s.points >= 5,
        progress: s.points >= 5 ? '已達成' : `${s.points} / 5 點`
      },
      {
        id: 'picasso',
        title: '小小畢卡索',
        desc: '完成並提交至少 1 件課堂手繪作品',
        icon: '<i class="fa-solid fa-palette" style="color: #ec4899;"></i>',
        unlocked: !!(s.portfolio && s.portfolio.length > 0),
        progress: (s.portfolio && s.portfolio.length > 0) ? '已提交創作' : '前往歷程手繪創作'
      },
      {
        id: 'teamwork',
        title: '蜂巢合作王',
        desc: '在課堂展現積極小組團隊協作',
        icon: '<i class="fa-solid fa-handshake-angle" style="color: #10b981;"></i>',
        unlocked: !!(s.history && s.history.some(h => (h.skillName || '').includes('合作') || (h.skillName || '').includes('小組'))),
        progress: '團隊合作獎勵'
      },
      {
        id: 'streak',
        title: '全勤火苗',
        desc: '連續 5 天登入蜂巢課堂認真採蜜',
        icon: '<i class="fa-solid fa-fire" style="color: #ef4444;"></i>',
        unlocked: true,
        progress: '連續 5 天全勤中'
      },
      {
        id: 'enthusiastic',
        title: '課堂發言之星',
        desc: '主動積極舉手發言獲得導師認可',
        icon: '<i class="fa-solid fa-bullhorn" style="color: #3b82f6;"></i>',
        unlocked: !!(s.history && s.history.some(h => (h.skillName || '').includes('積極') || (h.skillName || '').includes('發言'))),
        progress: '積極發言獎勵'
      },
      {
        id: 'kindness',
        title: '熱心助人天使',
        desc: '展現友愛互助，主動協助班級隊友',
        icon: '<i class="fa-solid fa-heart" style="color: #f43f5e;"></i>',
        unlocked: !!(s.history && s.history.some(h => (h.skillName || '').includes('助人') || (h.skillName || '').includes('友愛') || (h.skillName || '').includes('熱心'))),
        progress: '熱心助人獎勵'
      },
      {
        id: 'legend',
        title: '傳奇蜂巢衛士',
        desc: '班級點數累積達 15 滴以上至高榮譽',
        icon: '<i class="fa-solid fa-crown" style="color: #eab308;"></i>',
        unlocked: s.points >= 15,
        progress: s.points >= 15 ? '榮耀解鎖' : `${s.points} / 15 點`
      }
    ];

    const unlockedCount = badges.filter(b => b.unlocked).length;
    if (countTag) {
      countTag.textContent = `已解鎖 ${unlockedCount} / ${badges.length} 個`;
    }

    wrap.innerHTML = badges.map(b => `
      <div class="badge-trophy-card ${b.unlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon-disc">
          ${b.unlocked ? b.icon : '<i class="fa-solid fa-lock" style="color: #94a3b8;"></i>'}
        </div>
        <div class="badge-name">${escapeHTML(b.title)}</div>
        <div class="badge-desc">${escapeHTML(b.desc)}</div>
        <div class="badge-status-tag" style="margin-top: 10px; font-size: 0.75rem; font-weight: 700; color: ${b.unlocked ? '#059669' : '#94a3b8'};">
          ${b.unlocked ? '✨ 已解鎖' : `🔒 ${escapeHTML(b.progress)}`}
        </div>
      </div>
    `).join('');
  }

  // Render Rewards Store Tab
  renderRewardsStore() {
    const grid = document.getElementById('student-rewards-grid');
    if (!grid) return;

    const s = this.getStudent();
    if (!s) return;

    const rewards = rewardStore.getRewards();
    grid.innerHTML = rewards.map(r => {
      const canAfford = s.points >= r.points;
      return `
        <div style="background: #ffffff; border: 1.5px solid ${canAfford ? '#fde68a' : '#e2e8f0'}; border-radius: 16px; padding: 22px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.2s;" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='none'">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <span style="font-size: 2.2rem;">${r.icon}</span>
              <span style="font-size: 0.9rem; font-weight: 800; background: ${canAfford ? '#fef3c7' : '#f1f5f9'}; color: ${canAfford ? '#b45309' : '#64748b'}; padding: 4px 12px; border-radius: var(--radius-full); border: 1px solid ${canAfford ? '#fde68a' : '#cbd5e1'};">
                🍯 ${r.points} 滴花蜜
              </span>
            </div>
            <h4 style="font-size: 1.15rem; font-weight: 800; color: #1e293b; margin-bottom: 6px;">${escapeHTML(r.title)}</h4>
            <p style="font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 16px;">${escapeHTML(r.desc)}</p>
          </div>
          <button class="btn btn-sm ${canAfford ? 'btn-primary' : 'btn-secondary'}" data-redeem-id="${r.id}" ${canAfford ? '' : 'disabled'} style="width: 100%; border-radius: 10px; font-weight: 700; ${canAfford ? 'background: linear-gradient(135deg, #f59e0b, #d97706);' : 'opacity: 0.6; cursor: not-allowed;'}">
            ${canAfford ? '✨ 立即兌換特權' : `尚缺 ${r.points - s.points} 滴`}
          </button>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-redeem-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rid = btn.dataset.redeemId;
        const res = rewardStore.redeem(this.currentStudentId, rid);
        if (res.success) {
          if (window.dojoAudio) window.dojoAudio.playFanfare();
          if (window.dojoConfetti) window.dojoConfetti.burst(null, null, 70);
          alert(`🎉 恭喜兌換成功！已使用 ${res.redemption.pointsSpent} 滴花蜜兌換「${res.redemption.rewardTitle}」，導師已收到通知！`);
          this.renderAll();
        } else {
          alert(`⚠️ ${res.message}`);
        }
      });
    });
  }

  // Render The Meadow Canvas
  renderStudentIslands() {
    const s = this.getStudent();
    if (!this.islandsInstance) {
      this.islandsInstance = new DojoIslands('student-islands-canvas', {
        playerName: s ? s.name : '小蜂隊員',
        playerColor: '#f59e0b',
        playerShape: this.traits.bodyShape || 'round',
        playerAccessory: this.traits.accessory || 'none',
        width: 800,
        height: 500
      });
      this.islandsInstance.start();
    } else if (s) {
      this.islandsInstance.player.name = s.name;
      this.islandsInstance.player.bodyShape = this.traits.bodyShape || 'round';
      this.islandsInstance.player.accessory = this.traits.accessory || 'none';
    }
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
      container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1 / -1; padding: 20px 0;">尚未有提交的手繪歷程，趕緊在上方手繪板畫出你的第一份作品吧！</p>`;
      return;
    }

    container.innerHTML = mySubs.map(sub => `
      <div style="border: 1px solid #fde68a; border-radius: 12px; padding: 12px; background: #fffdf5;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 700; font-size: 0.85rem; color: #1e293b;">${new Date(sub.timestamp).toLocaleDateString()}</span>
          <span style="font-size: 0.8rem; font-weight: 800; padding: 2px 8px; border-radius: var(--radius-full); ${sub.status === 'approved' ? 'background: #dcfce7; color: #166534;' : 'background: #fef3c7; color: #92400e;'}">
            ${sub.status === 'approved' ? '✅ 導師已核准' : '⏳ 審核中'}
          </span>
        </div>
        <div style="background: white; border-radius: 8px; overflow: hidden; margin-bottom: 8px; text-align: center; border: 1px solid #fde68a;">
          <img src="${sub.drawingData}" alt="學生手繪作品" style="max-width: 100%; height: 130px; object-fit: contain;">
        </div>
        <p style="font-size: 0.85rem; color: #1e293b;">${escapeHTML(sub.caption)}</p>
      </div>
    `).join('');
  }

  // Render Hive Story Feed
  renderStoriesTab() {
    const list = document.getElementById('student-story-posts');
    if (!list) return;

    const posts = store.state.stories.filter(p => p.classId === this.activeClass.id);
    list.innerHTML = posts.map(post => `
      <div class="post-card" style="border: 1.5px solid #fde68a; background: #ffffff;">
        <div class="post-header">
          <div class="post-avatar" style="background: #fef3c7; border: 1.5px solid #fde68a; font-size: 1.3rem;">🐝</div>
          <div class="post-meta">
            <h4>${escapeHTML(post.author)}</h4>
            <span style="color: #64748b;">蜂巢課堂公告</span>
          </div>
        </div>
        <div class="post-content" style="color: #334155; line-height: 1.6;">${escapeHTML(post.content).replace(/\n/g, '<br>')}</div>
        ${post.poll ? `
          <div class="hive-poll-box" style="margin: 14px 0; padding: 14px 16px; background: #fffdf5; border: 1.5px solid #fde68a; border-radius: 12px;">
            <div style="font-weight: 800; font-size: 0.95rem; color: #78350f; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span>📊</span>
              <span>${escapeHTML(post.poll.question)}</span>
            </div>
            <div class="poll-options-list" style="display: flex; flex-direction: column; gap: 8px;">
              ${post.poll.options.map(opt => {
                const total = post.poll.options.reduce((sum, o) => sum + (o.votes || 0), 0);
                const pct = total > 0 ? Math.round(((opt.votes || 0) / total) * 100) : 0;
                const isSelected = post.poll.userVoted === opt.id;
                return `
                  <button class="poll-option-btn ${isSelected ? 'selected' : ''}" data-student-poll-post="${post.id}" data-student-poll-opt="${opt.id}" style="position: relative; width: 100%; text-align: left; padding: 10px 14px; border: 1.5px solid ${isSelected ? '#f59e0b' : '#fde68a'}; border-radius: 8px; background: #ffffff; cursor: pointer; overflow: hidden; font-family: inherit;">
                    <div class="poll-bar-fill" style="position: absolute; left: 0; top: 0; bottom: 0; width: ${pct}%; background: ${isSelected ? '#fde68a' : '#fef3c7'}; z-index: 1; transition: width 0.4s ease; opacity: 0.6;"></div>
                    <div style="position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 0.9rem; font-weight: ${isSelected ? '800' : '600'}; color: #1e293b;">
                        ${isSelected ? '✅ ' : '⚪ '}${escapeHTML(opt.text)}
                      </span>
                      <span style="font-size: 0.85rem; font-weight: 700; color: #b45309;">
                        ${pct}% (${opt.votes || 0} 票)
                      </span>
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 8px; text-align: right;">
              總計 ${post.poll.options.reduce((sum, o) => sum + (o.votes || 0), 0)} 票 • 小蜜蜂即時投票
            </div>
          </div>
        ` : ''}
        <div class="post-footer">
          <button class="like-btn ${post.liked ? 'liked' : ''}" data-student-like="${post.id}">
            <span>${post.liked ? '❤️' : '🤍'}</span>
            <span>${post.likes} 個愛心點讚</span>
          </button>
        </div>
      </div>
    `).join('');

    // Attach poll voting events
    list.querySelectorAll('[data-student-poll-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.studentPollPost;
        const oid = btn.dataset.studentPollOpt;
        store.voteStoryPoll(pid, oid);
        if (window.dojoAudio) window.dojoAudio.playHoneyDrop();
        this.renderStoriesTab();
      });
    });

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
