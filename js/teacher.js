import { store, escapeHTML, maskSensitiveCode } from './store.js';
import { StorageQuotaManager } from './security.js';
import { calendarManager } from './events-calendar.js';
import { DojoIslands } from './dojo-islands.js';
import { bigIdeasManager } from './big-ideas.js';
import { rewardStore } from './rewards-store.js';

class TeacherController {
  constructor() {
    this.currentView = 'classroom'; // 'classroom' | 'story' | 'messages' | 'calendar' | 'islands' | 'portfolios'
    this.classroomMode = 'students'; // 'students' | 'groups'
    this.isAttendanceMode = false;
    this.isMultipleMode = false;
    this.selectedStudentIds = new Set();
    this.studentSearchQuery = '';
    
    // Target for skills modal
    this.awardTarget = { type: 'student', id: null, name: '' };
    
    // Active chat parent
    this.activeChatStudentId = 'stu_demo_1';

    // Dojo Islands instance
    this.islandsEngine = null;

    // Timer state
    this.timerDuration = 60;
    this.timerRemaining = 60;
    this.timerInterval = null;
    this.isTimerRunning = false;

    // Noise meter simulation & mic
    this.noiseInterval = null;
    this.noiseSensitivity = 75;
    this.isMicActive = false;
    this.micStream = null;
    this.micAudioCtx = null;
    // Think-Pair-Share state
    this.thinkPairRemaining = 60;
    this.thinkPairInterval = null;
    this.isThinkPairRunning = false;
    this.thinkPairPrompts = [
      '「如果遇到一道目前還解不開的難題，你可以對自己或夥伴說什麼呢？」',
      '「課堂實驗中，水分子是怎麼運動的？請和同桌夥伴互相說明 30 秒！」',
      '「分享一件今天最讓你感到成就感的小事，並給身邊夥伴一個熱情的擊掌！」',
      '「如果蜜蜂要告訴花朵感謝的話，你覺得牠會說些什麼？請用一句話表達！」',
      '「在團隊協作時，如果組員有不同的想法，我們可以用什麼好方法找到共識？」'
    ];
    this.currentPromptIdx = 0;

    // Directions state
    this.directionsPresets = {
      science: {
        title: '🧪 自然科學探究任務',
        steps: [
          { text: '拿出自然課本翻至第 42 頁，安靜預覽實驗器材圖', done: false },
          { text: '與小組成員討論水火箭受壓原理並記錄於手稿', done: false },
          { text: '由小組長分配實驗觀察記錄員與器材操作員', done: false }
        ]
      },
      reading: {
        title: '📖 晨讀專注任務',
        steps: [
          { text: '自選一本喜歡的科學或文學繪本安靜閱讀 15 分鐘', done: false },
          { text: '在閱讀小卡上寫下一句最有感觸的金句', done: false },
          { text: '向右邊的同伴分享書中最喜歡的插圖或情節', done: false }
        ]
      },
      clean: {
        title: '🧹 課後蜂巢打掃整理',
        steps: [
          { text: '將個人桌面收拾乾淨，文具與水壺放回置物籃', done: false },
          { text: '各小組將桌椅靠攏對齊向日葵地線', done: false },
          { text: '值日小蜂檢查黑板與板擦是否已清理乾淨', done: false }
        ]
      }
    };
    this.currentDirections = JSON.parse(JSON.stringify(this.directionsPresets.science));

    this.init();
  }

  init() {
    this.bindDOMElements();
    this.bindEvents();
    this.renderAll();

    if (window.setupSoundToggle) {
      window.setupSoundToggle();
    }

    // Subscribe to store updates
    store.subscribe(() => {
      this.renderAll();
    });
  }

  bindDOMElements() {
    // Top Tabs
    this.tabClassroom = document.getElementById('tab-btn-classroom');
    this.tabStory = document.getElementById('tab-btn-story');
    this.tabMessages = document.getElementById('tab-btn-messages');
    this.tabCalendar = document.getElementById('tab-btn-calendar');
    this.tabIslands = document.getElementById('tab-btn-islands');
    this.tabPortfolios = document.getElementById('tab-btn-portfolios');

    // Views
    this.viewClassroom = document.getElementById('view-classroom');
    this.viewStory = document.getElementById('view-story');
    this.viewMessages = document.getElementById('view-messages');
    this.viewCalendar = document.getElementById('view-calendar');
    this.viewIslands = document.getElementById('view-islands');
    this.viewPortfolios = document.getElementById('view-portfolios');

    // Classroom headers
    this.classSelect = document.getElementById('class-select');
    this.classDisplayName = document.getElementById('class-display-name');
    this.classStudentCount = document.getElementById('class-student-count');
    this.classCodeTag = document.getElementById('class-code-tag');
    this.classBadgeIcon = document.getElementById('class-badge-icon');

    // Grids
    this.studentsGrid = document.getElementById('students-grid');
    this.groupsGrid = document.getElementById('groups-grid');

    // Bars
    this.attendanceBar = document.getElementById('attendance-bar');
    this.multipleSelectBar = document.getElementById('multiple-select-bar');
    this.selectedCountTag = document.getElementById('selected-student-count');

    // Modals
    this.skillsModal = document.getElementById('skills-modal');
    this.toolkitModal = document.getElementById('toolkit-modal');
    this.timerModal = document.getElementById('timer-modal');
    this.randomModal = document.getElementById('random-modal');
    this.groupsModal = document.getElementById('groups-modal');
    this.noiseModal = document.getElementById('noise-modal');
    this.addStudentModal = document.getElementById('add-student-modal');
    this.bigIdeasModal = document.getElementById('bigideas-modal');
    this.addEventModal = document.getElementById('add-event-modal');
    this.exportReportModal = document.getElementById('export-report-modal');
    this.thinkPairModal = document.getElementById('thinkpair-modal');
    this.directionsModal = document.getElementById('directions-modal');
    this.portfolioReviewModal = document.getElementById('portfolio-review-modal');
    this.addActivityModal = document.getElementById('add-activity-modal');
    this.musicModal = document.getElementById('music-modal');
    this.securityVaultModal = document.getElementById('security-vault-modal');
    this.isMusicPlaying = false;
    this.currentReviewTarget = null;
    this.selectedFlowerSticker = '🌸 構思精巧花';
  }

  bindEvents() {
    // Navigation Tabs
    this.tabClassroom?.addEventListener('click', () => this.switchView('classroom'));
    this.tabStory?.addEventListener('click', () => this.switchView('story'));
    this.tabMessages?.addEventListener('click', () => this.switchView('messages'));
    this.tabCalendar?.addEventListener('click', () => this.switchView('calendar'));
    this.tabIslands?.addEventListener('click', () => this.switchView('islands'));
    this.tabPortfolios?.addEventListener('click', () => this.switchView('portfolios'));

    // Calendar Modal Controls
    document.getElementById('btn-add-calendar-event')?.addEventListener('click', () => this.openModal(this.addEventModal));
    document.getElementById('btn-close-add-event')?.addEventListener('click', () => this.closeModal(this.addEventModal));
    document.getElementById('btn-cancel-add-event')?.addEventListener('click', () => this.closeModal(this.addEventModal));
    document.getElementById('btn-submit-add-event')?.addEventListener('click', () => this.submitAddEvent());

    // Portfolio Activity & Review Modal Controls
    document.getElementById('btn-create-activity')?.addEventListener('click', () => this.openModal(this.addActivityModal));
    document.getElementById('btn-close-add-activity')?.addEventListener('click', () => this.closeModal(this.addActivityModal));
    document.getElementById('btn-cancel-add-activity')?.addEventListener('click', () => this.closeModal(this.addActivityModal));
    document.getElementById('btn-submit-add-activity')?.addEventListener('click', () => this.submitAddActivity());

    document.getElementById('btn-close-portfolio-review')?.addEventListener('click', () => this.closeModal(this.portfolioReviewModal));
    document.getElementById('btn-cancel-review')?.addEventListener('click', () => this.closeModal(this.portfolioReviewModal));
    document.getElementById('btn-confirm-approve')?.addEventListener('click', () => this.confirmApproveReview());
    document.getElementById('btn-review-return')?.addEventListener('click', () => this.returnReview());

    // Flower sticker selector
    document.getElementById('flower-sticker-picker')?.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#flower-sticker-picker .preset-chip').forEach(c => {
          c.classList.remove('active-flower');
          c.style.background = '#ffffff';
          c.style.borderColor = '#e2e8f0';
        });
        chip.classList.add('active-flower');
        chip.style.background = '#fef3c7';
        chip.style.borderColor = '#f59e0b';
        this.selectedFlowerSticker = chip.dataset.sticker;
      });
    });

    // Preset comment chips
    document.querySelectorAll('.preset-comment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentBox = document.getElementById('review-teacher-comment');
        if (commentBox) {
          commentBox.value = btn.dataset.comment;
          commentBox.focus();
        }
      });
    });

    // Big Ideas Modal Controls
    document.getElementById('dock-btn-bigideas')?.addEventListener('click', () => this.openBigIdeasModal());
    document.getElementById('btn-close-bigideas')?.addEventListener('click', () => this.closeModal(this.bigIdeasModal));

    // Mobile nav bar items
    document.getElementById('mob-nav-classroom')?.addEventListener('click', () => this.switchView('classroom'));
    document.getElementById('mob-nav-toolkit')?.addEventListener('click', () => this.openModal(this.toolkitModal));
    document.getElementById('mob-nav-story')?.addEventListener('click', () => this.switchView('story'));
    document.getElementById('mob-nav-messages')?.addEventListener('click', () => this.switchView('messages'));

    // Class selector
    this.classSelect.addEventListener('change', (e) => {
      if (e.target.value === '__add_new__') {
        const name = prompt('請輸入新班級名稱：', '四年丙班 探索號');
        if (name) {
          const newCls = store.addClass(name);
          this.classSelect.value = newCls.id;
        } else {
          this.classSelect.value = store.state.activeClassId;
        }
      } else {
        store.setActiveClass(e.target.value);
      }
    });

    // View switch: Students vs Groups
    document.getElementById('btn-switch-students').addEventListener('click', () => {
      this.classroomMode = 'students';
      document.getElementById('btn-switch-students').classList.add('active');
      document.getElementById('btn-switch-groups').classList.remove('active');
      this.studentsGrid.style.display = 'grid';
      this.groupsGrid.style.display = 'none';
      const podiumWrap = document.getElementById('groups-podium-wrap');
      if (podiumWrap) podiumWrap.style.display = 'none';
    });

    document.getElementById('btn-switch-groups').addEventListener('click', () => {
      this.classroomMode = 'groups';
      document.getElementById('btn-switch-groups').classList.add('active');
      document.getElementById('btn-switch-students').classList.remove('active');
      this.studentsGrid.style.display = 'none';
      this.groupsGrid.style.display = 'grid';
      this.renderGroups();
    });

    // Give Whole Class point button
    document.getElementById('btn-give-whole-class').addEventListener('click', () => {
      this.openSkillsModal({ type: 'whole_class', name: '全班同學' });
    });

    // Attendance Bar buttons
    document.getElementById('btn-mark-all-present')?.addEventListener('click', () => {
      const cls = store.getActiveClass();
      cls.students.forEach(s => s.attendance = 'present');
      store.save();
      this.renderStudents();
    });

    document.getElementById('btn-mark-all-absent')?.addEventListener('click', () => {
      const cls = store.getActiveClass();
      cls.students.forEach(s => s.attendance = 'absent');
      store.save();
      this.renderStudents();
    });

    document.getElementById('btn-finish-attendance')?.addEventListener('click', () => {
      this.isAttendanceMode = false;
      this.attendanceBar.style.display = 'none';
      document.getElementById('dock-btn-attendance')?.classList.remove('active');
      this.renderStudents();
    });

    // Multiple Select Bar buttons
    document.getElementById('btn-select-all-students')?.addEventListener('click', () => {
      const cls = store.getActiveClass();
      cls.students.forEach(s => this.selectedStudentIds.add(s.id));
      this.updateMultipleBar();
      this.renderStudents();
    });

    document.getElementById('btn-cancel-multiple')?.addEventListener('click', () => {
      this.isMultipleMode = false;
      this.selectedStudentIds.clear();
      this.multipleSelectBar.style.display = 'none';
      document.getElementById('dock-btn-multiple')?.classList.remove('active');
      this.renderStudents();
    });

    document.getElementById('btn-award-selected')?.addEventListener('click', () => {
      if (this.selectedStudentIds.size === 0) {
        alert('請先在學生卡片上勾選至少一位學生！');
        return;
      }
      this.openSkillsModal({
        type: 'multiple',
        studentIds: Array.from(this.selectedStudentIds),
        name: `已選取 ${this.selectedStudentIds.size} 位學生`
      });
    });

    // Class Code Modal Controls
    const classCodeModal = document.getElementById('class-code-modal');
    document.getElementById('btn-show-class-code')?.addEventListener('click', () => {
      this.openModal(classCodeModal);
    });
    document.getElementById('btn-close-class-code')?.addEventListener('click', () => {
      this.closeModal(classCodeModal);
    });
    document.getElementById('btn-print-qr-cards')?.addEventListener('click', () => {
      window.print();
    });

    // Real-Time Student Search / Filter Controls
    const searchInput = document.getElementById('input-search-student');
    const clearSearchBtn = document.getElementById('btn-clear-search-student');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.studentSearchQuery = e.target.value.trim().toLowerCase();
        if (clearSearchBtn) {
          clearSearchBtn.style.display = this.studentSearchQuery ? 'block' : 'none';
        }
        this.renderStudents();
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
          e.stopPropagation();
          searchInput.value = '';
          this.studentSearchQuery = '';
          if (clearSearchBtn) clearSearchBtn.style.display = 'none';
          this.renderStudents();
        }
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.studentSearchQuery = '';
        clearSearchBtn.style.display = 'none';
        this.renderStudents();
        searchInput?.focus();
      });
    }

    // Breakthrough 1: Presentation Mode Toggle
    const btnPres = document.getElementById('btn-toggle-presentation');
    btnPres?.addEventListener('click', () => {
      const isPres = document.body.classList.toggle('presentation-mode');
      btnPres.innerHTML = isPres ? '<i class="fa-solid fa-compress"></i> 退出投影展示' : '<i class="fa-solid fa-expand"></i> 投影展示模式';
      btnPres.classList.toggle('btn-primary', isPres);
      btnPres.classList.toggle('btn-secondary', !isPres);
      if (window.dojoAudio) window.dojoAudio.playPositive();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('presentation-mode')) {
        document.body.classList.remove('presentation-mode');
        if (btnPres) {
          btnPres.innerHTML = '<i class="fa-solid fa-expand"></i> 投影展示模式';
          btnPres.classList.remove('btn-primary');
          btnPres.classList.add('btn-secondary');
        }
      }
    });

    // Breakthrough 8: Classroom Quick SFX Soundboard Dock Controls
    document.getElementById('sfx-btn-bell')?.addEventListener('click', () => {
      if (window.dojoAudio) window.dojoAudio.playBell();
    });
    document.getElementById('sfx-btn-applause')?.addEventListener('click', () => {
      if (window.dojoAudio) window.dojoAudio.playApplause();
      if (window.dojoConfetti) window.dojoConfetti.burst(null, null, 40);
    });
    document.getElementById('sfx-btn-fanfare')?.addEventListener('click', () => {
      if (window.dojoAudio) window.dojoAudio.playFanfare();
      if (window.dojoConfetti) window.dojoConfetti.burst(null, null, 60);
    });
    document.getElementById('sfx-btn-quiet')?.addEventListener('click', () => {
      if (window.dojoAudio) window.dojoAudio.playQuietChime();
    });
    document.getElementById('sfx-btn-countdown')?.addEventListener('click', () => {
      if (window.dojoAudio) window.dojoAudio.playCountdownBeeps();
    });
    const sfxMusicBtn = document.getElementById('sfx-btn-focus-music');
    sfxMusicBtn?.addEventListener('click', () => {
      if (!window.dojoAudio) return;
      const isPlaying = window.dojoAudio.isAmbientPlaying();
      if (isPlaying) {
        window.dojoAudio.stopAmbientFocus();
        sfxMusicBtn.classList.remove('active');
        const lbl = document.getElementById('sfx-music-label');
        if (lbl) lbl.textContent = '專注音樂';
      } else {
        window.dojoAudio.startAmbientFocus();
        sfxMusicBtn.classList.add('active');
        const lbl = document.getElementById('sfx-music-label');
        if (lbl) lbl.textContent = '播放中...';
      }
    });

    // Keyboard Shortcuts for SFX Soundboard
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'b') {
        document.getElementById('sfx-btn-bell')?.click();
      } else if (k === 'c') {
        document.getElementById('sfx-btn-applause')?.click();
      } else if (k === 'f') {
        document.getElementById('sfx-btn-fanfare')?.click();
      } else if (k === 'q') {
        document.getElementById('sfx-btn-quiet')?.click();
      } else if (k === 't') {
        document.getElementById('sfx-btn-countdown')?.click();
      } else if (k === 'm') {
        document.getElementById('sfx-btn-focus-music')?.click();
      }
    });

    // Security Vault Modal Controls
    document.getElementById('btn-open-vault')?.addEventListener('click', () => this.openSecurityVaultModal());
    document.getElementById('btn-close-vault')?.addEventListener('click', () => this.closeModal(this.securityVaultModal));
    document.getElementById('btn-close-vault-footer')?.addEventListener('click', () => this.closeModal(this.securityVaultModal));
    document.getElementById('btn-vault-export')?.addEventListener('click', () => this.exportVaultData());
    document.getElementById('btn-vault-import-btn')?.addEventListener('click', () => {
      document.getElementById('vault-file-input')?.click();
    });
    document.getElementById('vault-file-input')?.addEventListener('change', (e) => this.handleVaultImport(e));
    document.getElementById('btn-vault-optimize')?.addEventListener('click', () => this.optimizeVaultData());

    // Floating Dock Buttons
    document.getElementById('dock-btn-toolkit')?.addEventListener('click', () => this.openModal(this.toolkitModal));
    document.getElementById('dock-btn-attendance')?.addEventListener('click', (e) => {
      this.isAttendanceMode = !this.isAttendanceMode;
      this.attendanceBar.style.display = this.isAttendanceMode ? 'flex' : 'none';
      e.currentTarget.classList.toggle('active', this.isAttendanceMode);
      if (this.isMultipleMode) {
        this.isMultipleMode = false;
        this.multipleSelectBar.style.display = 'none';
      }
      this.renderStudents();
    });

    document.getElementById('dock-btn-multiple')?.addEventListener('click', (e) => {
      this.isMultipleMode = !this.isMultipleMode;
      this.selectedStudentIds.clear();
      this.multipleSelectBar.style.display = this.isMultipleMode ? 'flex' : 'none';
      e.currentTarget.classList.toggle('active', this.isMultipleMode);
      if (this.isAttendanceMode) {
        this.isAttendanceMode = false;
        this.attendanceBar.style.display = 'none';
      }
      this.updateMultipleBar();
      this.renderStudents();
    });

    document.getElementById('dock-btn-timer')?.addEventListener('click', () => this.openTimerModal());
    document.getElementById('dock-btn-random')?.addEventListener('click', () => this.openRandomModal());
    document.getElementById('dock-btn-groups-maker')?.addEventListener('click', () => this.openGroupsMakerModal());
    document.getElementById('dock-btn-noise')?.addEventListener('click', () => this.openNoiseModal());

    // Skills Modal Events
    document.getElementById('btn-close-skills')?.addEventListener('click', () => this.closeModal(this.skillsModal));
    document.getElementById('btn-tab-pos')?.addEventListener('click', () => {
      document.getElementById('btn-tab-pos').classList.add('active');
      document.getElementById('btn-tab-neg').classList.remove('active');
      document.getElementById('pos-skills-grid').style.display = 'grid';
      document.getElementById('neg-skills-grid').style.display = 'none';
    });
    document.getElementById('btn-tab-neg')?.addEventListener('click', () => {
      document.getElementById('btn-tab-neg').classList.add('active');
      document.getElementById('btn-tab-pos').classList.remove('active');
      document.getElementById('pos-skills-grid').style.display = 'none';
      document.getElementById('neg-skills-grid').style.display = 'grid';
    });

    // Custom Skill Add
    document.getElementById('btn-add-custom-skill')?.addEventListener('click', () => {
      const name = prompt('請輸入技能名稱：', '熱心助人');
      if (!name) return;
      const pts = parseInt(prompt('點數變化（正數如 1，或負數如 -1）：', '1'), 10) || 1;
      const cls = store.getActiveClass();
      const newSkill = { id: `skill_${Date.now()}`, name, points: pts, icon: pts > 0 ? '✨' : '⚠️' };
      if (pts >= 0) cls.skills.positive.push(newSkill);
      else cls.skills.needsWork.push(newSkill);
      store.save();
      this.renderSkillsModalContent();
    });

    // Toolkit Modal Cards
    document.getElementById('btn-close-toolkit')?.addEventListener('click', () => this.closeModal(this.toolkitModal));
    document.getElementById('tk-card-timer')?.addEventListener('click', () => {
      this.closeModal(this.toolkitModal);
      this.openTimerModal();
    });
    document.getElementById('tk-card-random')?.addEventListener('click', () => {
      this.closeModal(this.toolkitModal);
      this.openRandomModal();
    });
    document.getElementById('tk-card-groups')?.addEventListener('click', () => {
      this.closeModal(this.toolkitModal);
      this.openGroupsMakerModal();
    });
    document.getElementById('tk-card-noise')?.addEventListener('click', () => {
      this.closeModal(this.toolkitModal);
      this.openNoiseModal();
    });
    document.getElementById('tk-card-thinkpair')?.addEventListener('click', () => {
      this.closeModal(this.toolkitModal);
      this.openThinkPairModal();
    });
    document.getElementById('tk-card-directions')?.addEventListener('click', () => {
      this.closeModal(this.toolkitModal);
      this.openDirectionsModal();
    });
    document.getElementById('tk-card-music')?.addEventListener('click', () => {
      this.closeModal(this.toolkitModal);
      this.openModal(this.musicModal);
    });

    // Classroom Focus Music Player Controls
    document.getElementById('btn-close-music')?.addEventListener('click', () => {
      this.closeModal(this.musicModal);
    });

    const musicBtn = document.getElementById('btn-music-toggle');
    const musicIcon = document.getElementById('music-toggle-icon');
    const musicLabel = document.getElementById('music-toggle-label');
    const vinylDisc = document.getElementById('music-vinyl-disc');

    musicBtn?.addEventListener('click', () => {
      this.isMusicPlaying = !this.isMusicPlaying;
      if (this.isMusicPlaying) {
        if (window.dojoAudio) window.dojoAudio.startAmbientFocus();
        if (musicIcon) musicIcon.className = 'fa-solid fa-pause';
        if (musicLabel) musicLabel.textContent = '暫停音樂';
        if (vinylDisc) vinylDisc.style.transform = 'rotate(360deg)';
      } else {
        if (window.dojoAudio) window.dojoAudio.stopAmbientFocus();
        if (musicIcon) musicIcon.className = 'fa-solid fa-play';
        if (musicLabel) musicLabel.textContent = '開始播放';
        if (vinylDisc) vinylDisc.style.transform = 'rotate(0deg)';
      }
    });

    document.querySelectorAll('.music-track-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.music-track-chip').forEach(c => {
          c.classList.remove('active');
          c.style.borderColor = '#e2e8f0';
          c.style.background = '#ffffff';
          c.style.color = '#1e293b';
        });
        chip.classList.add('active');
        chip.style.borderColor = '#ec4899';
        chip.style.background = '#fdf2f8';
        chip.style.color = '#9d174d';
        const nameEl = document.getElementById('music-current-track-name');
        if (nameEl) nameEl.textContent = chip.dataset.track === 'meadow' ? '🌻 向日葵草甸微風 (Calm Meadow)' : '🐝 蜂巢專注白噪音 (Beehive Focus)';
        if (this.isMusicPlaying && window.dojoAudio) {
          window.dojoAudio.startAmbientFocus();
        }
      });
    });

    // Interactive Class Mascot Badge Selector
    document.getElementById('class-badge-icon')?.addEventListener('click', () => {
      const icons = ['🚀', '🌻', '🐝', '🌈', '👑', '⭐', '🎨', '🌿', '💎'];
      const badge = document.getElementById('class-badge-icon');
      const current = badge ? badge.textContent.trim() : '🚀';
      const nextIdx = (icons.indexOf(current) + 1) % icons.length;
      if (badge) badge.textContent = icons[nextIdx];
      const cls = store.getActiveClass();
      if (cls) {
        cls.icon = icons[nextIdx];
        store.save();
      }
      if (window.dojoAudio) window.dojoAudio.playPositive();
      if (window.dojoConfetti) window.dojoConfetti.burst(null, null, 25);
    });

    // Think-Pair-Share Controls
    document.getElementById('btn-close-thinkpair')?.addEventListener('click', () => {
      this.pauseThinkPairTimer();
      this.closeModal(this.thinkPairModal);
    });
    document.getElementById('btn-next-prompt')?.addEventListener('click', () => this.nextThinkPairPrompt());
    document.getElementById('btn-custom-prompt')?.addEventListener('click', () => {
      const q = prompt('請輸入自訂的課堂討論引導題：');
      if (q && q.trim()) {
        const textEl = document.getElementById('thinkpair-prompt-text');
        if (textEl) textEl.textContent = `「${q.trim()}」`;
      }
    });
    document.getElementById('btn-thinkpair-timer-toggle')?.addEventListener('click', () => this.toggleThinkPairTimer());
    document.getElementById('btn-thinkpair-timer-reset')?.addEventListener('click', () => this.resetThinkPairTimer());

    // Directions Controls
    document.getElementById('btn-close-directions')?.addEventListener('click', () => this.closeModal(this.directionsModal));
    document.getElementById('directions-preset-select')?.addEventListener('change', (e) => this.loadDirectionsPreset(e.target.value));
    document.getElementById('btn-add-step')?.addEventListener('click', () => {
      const input = document.getElementById('input-new-step');
      const val = input.value.trim();
      if (!val) return;
      this.addDirectionsStep(val);
      input.value = '';
    });
    document.getElementById('input-new-step')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-add-step')?.click();
      }
    });

    // Timer Modal Controls
    document.getElementById('btn-close-timer')?.addEventListener('click', () => {
      this.pauseTimer();
      this.closeModal(this.timerModal);
    });
    document.getElementById('btn-timer-toggle')?.addEventListener('click', () => this.toggleTimer());
    document.getElementById('btn-timer-reset')?.addEventListener('click', () => this.resetTimer());
    document.querySelectorAll('#timer-modal .preset-chip[data-seconds]').forEach(btn => {
      btn.addEventListener('click', () => {
        const secs = parseInt(btn.dataset.seconds, 10);
        if (!isNaN(secs)) {
          this.setTimerPreset(secs);
        }
      });
    });

    // Random Modal Controls
    document.getElementById('btn-close-random')?.addEventListener('click', () => this.closeModal(this.randomModal));
    document.getElementById('btn-spin-random')?.addEventListener('click', () => this.spinRandomPicker());
    document.getElementById('lucky-wheel-canvas')?.addEventListener('click', () => this.spinRandomPicker());
    document.getElementById('btn-award-picked')?.addEventListener('click', () => {
      if (this.lastPickedStudent) {
        this.closeModal(this.randomModal);
        this.openSkillsModal({ type: 'student', id: this.lastPickedStudent.id, name: this.lastPickedStudent.name });
      }
    });

    // Groups Maker Controls
    document.getElementById('btn-close-groups')?.addEventListener('click', () => this.closeModal(this.groupsModal));
    document.getElementById('btn-shuffle-teams')?.addEventListener('click', () => this.shuffleGroups());
    document.getElementById('group-size-select')?.addEventListener('change', () => this.shuffleGroups());

    // Noise Meter Controls
    document.getElementById('btn-close-noise')?.addEventListener('click', () => {
      this.stopNoiseMeter();
      this.closeModal(this.noiseModal);
    });
    document.getElementById('noise-sensitivity')?.addEventListener('input', (e) => {
      this.noiseSensitivity = parseInt(e.target.value, 10);
      document.getElementById('noise-threshold-val').textContent = `${this.noiseSensitivity}%`;
      document.getElementById('noise-threshold-line').style.left = `${this.noiseSensitivity}%`;
    });
    document.getElementById('btn-toggle-mic')?.addEventListener('click', () => {
      this.toggleMicrophone();
    });

    // Add Student Modal Controls
    document.getElementById('btn-close-add-student')?.addEventListener('click', () => this.closeModal(this.addStudentModal));
    document.getElementById('btn-cancel-add-student')?.addEventListener('click', () => this.closeModal(this.addStudentModal));
    document.getElementById('btn-submit-add-student')?.addEventListener('click', () => {
      const input = document.getElementById('new-student-name');
      const name = input.value.trim();
      if (!name) return;
      store.addStudent(store.state.activeClassId, name);
      input.value = '';
      this.closeModal(this.addStudentModal);
      if (window.dojoAudio) window.dojoAudio.playPositive();
      if (window.dojoConfetti) window.dojoConfetti.burst();
    });

    document.getElementById('new-student-name')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-submit-add-student')?.click();
      }
    });

    // Milestone Goal Modal Controls
    const milestoneModal = document.getElementById('milestone-goal-modal');
    document.getElementById('btn-edit-milestone-goal')?.addEventListener('click', () => this.openMilestoneModal());
    document.getElementById('btn-close-milestone-modal')?.addEventListener('click', () => this.closeModal(milestoneModal));
    document.getElementById('btn-cancel-milestone-modal')?.addEventListener('click', () => this.closeModal(milestoneModal));
    document.getElementById('btn-save-milestone-modal')?.addEventListener('click', () => this.saveMilestoneModal());

    // Class Story Posting & Poll Creator
    document.getElementById('story-post-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('btn-publish-story')?.click();
      }
    });

    document.getElementById('btn-toggle-poll-box')?.addEventListener('click', () => {
      const wrap = document.getElementById('story-poll-input-wrap');
      if (wrap) {
        wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
        if (window.dojoAudio) window.dojoAudio.playTick();
      }
    });

    document.getElementById('btn-publish-story')?.addEventListener('click', () => {
      const textarea = document.getElementById('story-post-input');
      const content = textarea.value.trim();
      if (!content) return;
      const preview = document.getElementById('story-image-preview');
      const img = preview.dataset.img || '';

      // Check for attached poll
      let poll = null;
      const pollWrap = document.getElementById('story-poll-input-wrap');
      if (pollWrap && pollWrap.style.display !== 'none') {
        const qInput = document.getElementById('poll-input-question');
        const opt1Input = document.getElementById('poll-input-opt1');
        const opt2Input = document.getElementById('poll-input-opt2');
        const opt3Input = document.getElementById('poll-input-opt3');

        const q = qInput ? qInput.value.trim() : '';
        const o1 = opt1Input ? opt1Input.value.trim() : '';
        const o2 = opt2Input ? opt2Input.value.trim() : '';
        const o3 = opt3Input ? opt3Input.value.trim() : '';

        if (q && o1 && o2) {
          poll = {
            id: `poll_${Date.now()}`,
            question: q,
            options: [
              { id: 'opt_1', text: o1, votes: 0 },
              { id: 'opt_2', text: o2, votes: 0 },
              ...(o3 ? [{ id: 'opt_3', text: o3, votes: 0 }] : [])
            ],
            userVoted: null
          };
        }
      }

      store.addStoryPost(store.state.activeClassId, '林老師 (Teacher Lin)', content, img, poll);
      textarea.value = '';
      preview.innerHTML = '';
      preview.style.display = 'none';
      delete preview.dataset.img;
      if (pollWrap) {
        pollWrap.style.display = 'none';
        ['poll-input-question', 'poll-input-opt1', 'poll-input-opt2', 'poll-input-opt3'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
      }
      if (window.dojoAudio) window.dojoAudio.playPositive();
      this.renderStories();
    });

    document.getElementById('btn-add-sample-img')?.addEventListener('click', () => {
      const preview = document.getElementById('story-image-preview');
      const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="160" viewBox="0 0 600 160"><rect width="100%" height="100%" fill="#e6f9f0"/><circle cx="100" cy="80" r="50" fill="#00d27a"/><circle cx="300" cy="80" r="45" fill="#3a86ff"/><circle cx="500" cy="80" r="48" fill="#ffbe0b"/><text x="50%" y="85" text-anchor="middle" fill="#2b3b48" font-size="20" font-weight="bold">🎉 課堂精彩時刻照片展示</text></svg>`;
      preview.innerHTML = sampleSvg;
      preview.style.display = 'block';
      preview.dataset.img = 'sample_activity.svg';
    });

    // Chat Message Sending
    document.getElementById('btn-send-message')?.addEventListener('click', () => {
      const input = document.getElementById('chat-input-text');
      const text = input.value.trim();
      if (!text) return;
      store.sendMessage(this.activeChatStudentId, 'teacher', text);
      input.value = '';
      if (window.dojoAudio) window.dojoAudio.playTick();
      this.renderChatMessages();
    });

    document.getElementById('chat-input-text')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-send-message').click();
    });

    // Export Report Modal Controls
    document.getElementById('btn-export-report')?.addEventListener('click', () => {
      this.openExportReportModal();
    });
    document.getElementById('btn-close-export-report')?.addEventListener('click', () => {
      this.closeModal(this.exportReportModal);
    });
    document.getElementById('btn-download-csv')?.addEventListener('click', () => {
      this.downloadReportCSV();
    });
    document.getElementById('btn-print-table-report')?.addEventListener('click', () => {
      window.print();
    });

    // Global Esc key & backdrop click for all modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this.closeTopModal();
      }
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeModal(backdrop);
        }
      });
    });
  }

  // View Switcher
  switchView(viewName) {
    this.currentView = viewName;
    [this.tabClassroom, this.tabStory, this.tabMessages, this.tabCalendar, this.tabIslands, this.tabPortfolios]
      .filter(Boolean).forEach(tab => tab.classList.remove('active'));
    [this.viewClassroom, this.viewStory, this.viewMessages, this.viewCalendar, this.viewIslands, this.viewPortfolios]
      .filter(Boolean).forEach(view => view.style.display = 'none');

    if (viewName === 'classroom') {
      this.tabClassroom?.classList.add('active');
      if (this.viewClassroom) this.viewClassroom.style.display = 'block';
      this.renderStudents();
    } else if (viewName === 'story') {
      this.tabStory?.classList.add('active');
      if (this.viewStory) this.viewStory.style.display = 'block';
      this.renderStories();
    } else if (viewName === 'messages') {
      this.tabMessages?.classList.add('active');
      if (this.viewMessages) this.viewMessages.style.display = 'block';
      this.renderMessages();
    } else if (viewName === 'calendar') {
      this.tabCalendar?.classList.add('active');
      if (this.viewCalendar) this.viewCalendar.style.display = 'block';
      this.renderCalendar();
    } else if (viewName === 'islands') {
      this.tabIslands?.classList.add('active');
      if (this.viewIslands) this.viewIslands.style.display = 'block';
      this.renderDojoIslands();
    } else if (viewName === 'portfolios') {
      this.tabPortfolios?.classList.add('active');
      if (this.viewPortfolios) this.viewPortfolios.style.display = 'block';
      this.renderPortfolios();
    }
  }

  renderAll() {
    this.renderClassDropdown();
    this.renderHeader();
    if (this.currentView === 'classroom') {
      this.renderStudents();
      if (this.classroomMode === 'groups') this.renderGroups();
    } else if (this.currentView === 'story') {
      this.renderStories();
    } else if (this.currentView === 'messages') {
      this.renderMessages();
    } else if (this.currentView === 'calendar') {
      this.renderCalendar();
    } else if (this.currentView === 'islands') {
      this.renderDojoIslands();
    } else if (this.currentView === 'portfolios') {
      this.renderPortfolios();
    }
  }

  renderClassDropdown() {
    this.classSelect.innerHTML = store.state.classes.map(c => `
      <option value="${c.id}" ${c.id === store.state.activeClassId ? 'selected' : ''}>${escapeHTML(c.name)}</option>
    `).join('') + `<option value="__add_new__">+ 新增班級...</option>`;
  }

  renderHeader() {
    const cls = store.getActiveClass();
    if (!cls) return;
    this.classDisplayName.textContent = cls.name;
    this.classStudentCount.textContent = cls.students.length;
    this.classCodeTag.textContent = cls.code;
    this.classBadgeIcon.textContent = cls.icon || '🎒';
    this.renderMilestoneGoal();
  }

  // Render Students Grid
  renderStudents() {
    const cls = store.getActiveClass();
    if (!cls) return;

    let html = '';
    const q = this.studentSearchQuery ? this.studentSearchQuery.trim().toLowerCase() : '';
    const filteredStudents = q
      ? cls.students.filter(s => s.name.toLowerCase().includes(q) || String(s.seatNumber) === q || `座號 ${s.seatNumber}`.toLowerCase().includes(q))
      : cls.students;

    // 1. Whole Class Card (shown only when not searching)
    if (!q) {
      html += `
        <div class="student-card whole-class-card" id="card-whole-class">
          <span class="points-badge">${cls.totalPoints}</span>
          <div class="monster-avatar-wrap">
            ${window.monsterEngine ? window.monsterEngine.renderWholeClassIcon(105) : ''}
          </div>
          <div class="student-name" style="font-weight: 800; color: var(--dojo-primary);">全班同學</div>
          <div class="student-sub">${cls.students.length} 位學生</div>
        </div>
      `;
    }

    // 2. Student Cards
    if (q && filteredStudents.length === 0) {
      html += `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: #fffdf5; border: 2px dashed #fde68a; border-radius: 16px;">
          <div style="font-size: 2.2rem; margin-bottom: 8px; color: #f59e0b;"><i class="fa-solid fa-magnifying-glass"></i></div>
          <h4 style="font-size: 1.15rem; font-weight: 800; color: #1e293b; margin-bottom: 6px;">查無符合「${escapeHTML(this.studentSearchQuery)}」的學生</h4>
          <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 16px;">請檢查姓名拼寫或座號，或點擊下方按鈕清除搜尋條件。</p>
          <button class="btn btn-secondary btn-sm" id="btn-reset-search-prompt" style="border-radius: var(--radius-full);"><i class="fa-solid fa-arrow-rotate-left"></i> 清除搜尋條件</button>
        </div>
      `;
    } else {
      filteredStudents.forEach(student => {
        const isSelected = this.selectedStudentIds.has(student.id);
        let monsterSvg = '';
        if (student.isHatched) {
          monsterSvg = window.monsterEngine ? window.monsterEngine.render(student.monster, 100) : '';
        } else {
          monsterSvg = window.monsterEngine ? window.monsterEngine.renderEgg(student.seed || student.name, 100) : '';
        }

        let attClass = `att-${student.attendance || 'present'}`;
        let ptsClass = student.points < 0 ? 'negative' : (student.points === 0 ? 'zero' : '');

        html += `
          <div class="student-card ${isSelected ? 'selected' : ''}" data-student-id="${student.id}">
            <div class="attendance-indicator ${attClass}" title="出勤狀態：${student.attendance}"></div>
            <span class="points-badge ${ptsClass}">${student.points}</span>
            ${this.isMultipleMode ? `<input type="checkbox" class="student-checkbox" ${isSelected ? 'checked' : ''} style="position: absolute; top: 12px; left: 12px; width: 18px; height: 18px; z-index: 5;">` : ''}
            <div class="monster-avatar-wrap">
              ${monsterSvg}
            </div>
            <div class="student-name">${escapeHTML(student.name)}</div>
            <div class="student-sub">座號 ${student.seatNumber}</div>
          </div>
        `;
      });

      // 3. Add Student Card
      html += `
        <div class="add-student-card" id="card-add-student">
          <div class="add-student-icon">+</div>
          <strong style="font-size: 0.95rem; color: var(--text-main);">添加學生</strong>
        </div>
      `;
    }

    this.studentsGrid.innerHTML = html;

    // Reset search button listener if present
    document.getElementById('btn-reset-search-prompt')?.addEventListener('click', () => {
      const searchInput = document.getElementById('input-search-student');
      const clearSearchBtn = document.getElementById('btn-clear-search-student');
      if (searchInput) searchInput.value = '';
      this.studentSearchQuery = '';
      if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      this.renderStudents();
      searchInput?.focus();
    });

    // Attach card event listeners
    document.getElementById('card-whole-class')?.addEventListener('click', () => {
      if (this.isAttendanceMode || this.isMultipleMode) return;
      this.openSkillsModal({ type: 'whole_class', name: '全班同學' });
    });

    document.getElementById('card-add-student')?.addEventListener('click', () => {
      this.openModal(this.addStudentModal);
    });

    this.studentsGrid.querySelectorAll('.student-card[data-student-id]').forEach(card => {
      const id = card.dataset.studentId;
      const student = cls.students.find(s => s.id === id);

      card.addEventListener('click', (e) => {
        if (this.isAttendanceMode) {
          // Cycle attendance status: present -> absent -> tardy -> left_early -> present
          const cycles = { present: 'absent', absent: 'tardy', tardy: 'left_early', left_early: 'present' };
          const next = cycles[student.attendance || 'present'] || 'present';
          store.setAttendance(cls.id, student.id, next);
          if (window.dojoAudio) window.dojoAudio.playTick();
          return;
        }

        if (this.isMultipleMode) {
          if (this.selectedStudentIds.has(id)) this.selectedStudentIds.delete(id);
          else this.selectedStudentIds.add(id);
          this.updateMultipleBar();
          this.renderStudents();
          return;
        }

        // Normal mode: award feedback points
        this.openSkillsModal({ type: 'student', id: student.id, name: student.name, monster: student.monster, isHatched: student.isHatched, points: student.points });
      });
    });
  }

  // Render Groups Grid & Podium
  renderGroups() {
    const cls = store.getActiveClass();
    if (!cls || !cls.groups) return;

    // Render Hive Group Collaborative Competition Leaderboard Podium
    const podiumWrap = document.getElementById('groups-podium-wrap');
    if (podiumWrap) {
      if (cls.groups.length > 0) {
        podiumWrap.style.display = 'block';
        const sortedGroups = [...cls.groups].sort((a, b) => (b.points || 0) - (a.points || 0));
        const top3 = sortedGroups.slice(0, 3);

        // Display order: 2nd place (left), 1st place (center), 3rd place (right)
        let displayOrder = [];
        if (top3.length === 1) {
          displayOrder = [{ grp: top3[0], rank: 1 }];
        } else if (top3.length === 2) {
          displayOrder = [{ grp: top3[1], rank: 2 }, { grp: top3[0], rank: 1 }];
        } else {
          displayOrder = [{ grp: top3[1], rank: 2 }, { grp: top3[0], rank: 1 }, { grp: top3[2], rank: 3 }];
        }

        const rankIcons = {
          1: '<i class="fa-solid fa-trophy"></i>',
          2: '<i class="fa-solid fa-medal"></i>',
          3: '<i class="fa-solid fa-award"></i>'
        };

        const rankBadges = {
          1: '👑 蜂王首獎',
          2: '🥈 銀蜜領航',
          3: '🥉 勤蜂季軍'
        };

        podiumWrap.innerHTML = `
          <div class="groups-podium-container">
            <div class="podium-header">
              <div class="podium-header-title">
                <i class="fa-solid fa-crown" style="color: #f59e0b;"></i>
                <span>蜂巢小組榮譽競賽榜 (Hive Groups Leaderboard)</span>
              </div>
              <div class="podium-header-sub">
                小隊合作互助採蜜 • 率先達到 50 滴蜜糖榮獲全班蜂王桂冠！點擊頒獎台可直接為該組全體加分
              </div>
            </div>
            <div class="podium-grid">
              ${displayOrder.map(item => {
                const grp = item.grp;
                const rank = item.rank;
                const members = grp.studentIds.map(id => cls.students.find(s => s.id === id)).filter(Boolean);
                const progressPct = Math.min(100, Math.round(((grp.points || 0) / 50) * 100));
                return `
                  <div class="podium-card rank-${rank}" data-podium-group-id="${grp.id}" title="點擊給 ${escapeHTML(grp.name)} 頒發協作蜜糖！">
                    <div class="podium-avatar-cluster">
                      ${members.slice(0, 3).map(m => `
                        <div style="width: 36px; height: 36px; margin-left: -10px; border-radius: 50%; background: #ffffff; border: 2px solid #fde68a; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                          ${m.isHatched ? (window.monsterEngine ? window.monsterEngine.render(m.monster, 36) : '') : (window.monsterEngine ? window.monsterEngine.renderEgg(m.name, 36) : '')}
                        </div>
                      `).join('')}
                    </div>
                    <div class="podium-name">${escapeHTML(grp.name)}</div>
                    <div class="podium-points-tag">
                      <i class="fa-solid fa-jar" style="color: #f59e0b;"></i>
                      <span>${grp.points || 0} 滴花蜜</span>
                    </div>
                    <div style="width: 80%; height: 6px; background: rgba(0,0,0,0.06); border-radius: 9999px; margin-bottom: 12px; overflow: hidden;" title="達標進度 ${progressPct}%">
                      <div style="width: ${progressPct}%; height: 100%; background: linear-gradient(90deg, #f59e0b, #10b981); border-radius: 9999px;"></div>
                    </div>
                    <div class="podium-pedestal">
                      <div class="podium-rank-badge">
                        ${rankIcons[rank]}
                      </div>
                      <span style="font-size: 0.75rem; font-weight: 800; color: #1e293b; background: rgba(255,255,255,0.7); padding: 2px 8px; border-radius: 9999px; margin-top: 2px;">
                        ${rankBadges[rank]}
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;

        podiumWrap.querySelectorAll('.podium-card[data-podium-group-id]').forEach(card => {
          card.addEventListener('click', () => {
            const gid = card.dataset.podiumGroupId;
            const grp = cls.groups.find(g => g.id === gid);
            if (grp) {
              this.openSkillsModal({ type: 'multiple', studentIds: grp.studentIds, name: grp.name });
            }
          });
        });
      } else {
        podiumWrap.style.display = 'none';
      }
    }

    this.groupsGrid.innerHTML = cls.groups.map(grp => {
      const members = grp.studentIds.map(id => cls.students.find(s => s.id === id)).filter(Boolean);
      return `
        <div class="group-team-card" style="cursor: pointer;" data-group-id="${grp.id}">
          <div class="group-team-header">
            <span>${escapeHTML(grp.name)}</span>
            <span class="points-badge" style="position: static;">${grp.points}</span>
          </div>
          <div style="display: flex; gap: 8px; margin: 12px 0;">
            ${members.map(m => `
              <div style="width: 44px; height: 44px;">
                ${m.isHatched ? window.monsterEngine.render(m.monster, 44) : window.monsterEngine.renderEgg(m.name, 44)}
              </div>
            `).join('')}
          </div>
          <button class="btn btn-outline-primary btn-sm" style="width: 100%;"><i class="fa-solid fa-star" style="color: #f59e0b;"></i> 給小組協作加分</button>
        </div>
      `;
    }).join('') + `
      <div class="add-student-card" id="card-create-group">
        <div class="add-student-icon" style="font-size: 1.5rem; color: #f59e0b;"><i class="fa-solid fa-users"></i></div>
        <strong style="font-size: 0.95rem; color: var(--text-main);">使用智慧分組機建立小組</strong>
      </div>
    `;

    document.getElementById('card-create-group')?.addEventListener('click', () => this.openGroupsMakerModal());
    this.groupsGrid.querySelectorAll('.group-team-card').forEach(card => {
      card.addEventListener('click', () => {
        const gid = card.dataset.groupId;
        const grp = cls.groups.find(g => g.id === gid);
        if (grp) {
          this.openSkillsModal({ type: 'multiple', studentIds: grp.studentIds, name: grp.name });
        }
      });
    });
  }

  updateMultipleBar() {
    if (this.selectedCountTag) {
      this.selectedCountTag.textContent = this.selectedStudentIds.size;
    }
  }

  // Skills Modal Management
  openSkillsModal(target) {
    this.awardTarget = target;
    const titleEl = document.getElementById('modal-award-title');
    const subEl = document.getElementById('modal-award-sub');
    const avatarEl = document.getElementById('modal-student-avatar');

    titleEl.textContent = `給予 ${target.name} 反饋`;
    subEl.textContent = target.points !== undefined ? `目前累積：${target.points} 點` : '';

    if (target.type === 'whole_class') {
      avatarEl.innerHTML = window.monsterEngine.renderWholeClassIcon(52);
    } else if (target.type === 'student') {
      avatarEl.innerHTML = target.isHatched ? window.monsterEngine.render(target.monster, 52) : window.monsterEngine.renderEgg(target.name, 52);
    } else {
      avatarEl.innerHTML = `👥`;
    }

    this.renderSkillsModalContent();
    this.openModal(this.skillsModal);
  }

  renderSkillsModalContent() {
    const cls = store.getActiveClass();
    const posContainer = document.getElementById('pos-skills-grid');
    const negContainer = document.getElementById('neg-skills-grid');

    posContainer.innerHTML = cls.skills.positive.map(skill => `
      <button class="skill-btn" data-skill-id="${skill.id}">
        <div class="skill-icon-wrap">
          <span>${skill.icon}</span>
          <span class="skill-pts-tag">+${skill.points}</span>
        </div>
        <span class="skill-label">${escapeHTML(skill.name)}</span>
      </button>
    `).join('');

    negContainer.innerHTML = cls.skills.needsWork.map(skill => `
      <button class="skill-btn needs-work" data-skill-id="${skill.id}">
        <div class="skill-icon-wrap">
          <span>${skill.icon}</span>
          <span class="skill-pts-tag">${skill.points}</span>
        </div>
        <span class="skill-label">${escapeHTML(skill.name)}</span>
      </button>
    `).join('');

    // Attach click triggers
    const onSkillClick = (skill) => {
      const activeCls = store.getActiveClass();
      if (this.awardTarget.type === 'student') {
        store.awardStudentPoint(activeCls.id, this.awardTarget.id, skill);
      } else if (this.awardTarget.type === 'whole_class') {
        store.awardWholeClassPoint(activeCls.id, skill);
      } else if (this.awardTarget.type === 'multiple') {
        store.awardMultipleStudents(activeCls.id, this.awardTarget.studentIds, skill);
      }

      // Audio & Confetti & Giant Celebration Splash
      if (skill.points > 0) {
        if (this.awardTarget.type === 'whole_class') {
          if (window.dojoAudio) window.dojoAudio.playFanfare();
        } else {
          if (window.dojoAudio) window.dojoAudio.playPositive();
        }
        if (window.dojoConfetti) window.dojoConfetti.burst();
        this.showCelebrationSplash(this.awardTarget, skill);
      } else {
        if (window.dojoAudio) window.dojoAudio.playNeedsWork();
        this.showCelebrationSplash(this.awardTarget, skill);
      }

      this.renderMilestoneGoal();
      this.closeModal(this.skillsModal);
    };

    posContainer.querySelectorAll('.skill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = cls.skills.positive.find(sk => sk.id === btn.dataset.skillId);
        if (s) onSkillClick(s);
      });
    });

    negContainer.querySelectorAll('.skill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = cls.skills.needsWork.find(sk => sk.id === btn.dataset.skillId);
        if (s) onSkillClick(s);
      });
    });
  }

  // Timer Feature
  openTimerModal() {
    this.openModal(this.timerModal);
    this.updateTimerDisplay();
  }

  toggleTimer() {
    const btn = document.getElementById('btn-timer-toggle');
    if (this.isTimerRunning) {
      this.pauseTimer();
      btn.textContent = '繼續計時';
    } else {
      this.isTimerRunning = true;
      btn.textContent = '暫停';
      this.timerInterval = setInterval(() => {
        this.timerRemaining--;
        this.updateTimerDisplay();
        if (this.timerRemaining <= 0) {
          this.pauseTimer();
          btn.textContent = '開始計時';
          if (window.dojoAudio) window.dojoAudio.playTimerAlarm();
          if (window.dojoConfetti) window.dojoConfetti.burst();
          alert('⏰ 時間到！課堂活動計時結束！');
        }
      }, 1000);
    }
  }

  pauseTimer() {
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
  }

  resetTimer() {
    this.pauseTimer();
    this.timerRemaining = this.timerDuration;
    document.getElementById('btn-timer-toggle').textContent = '開始計時';
    this.updateTimerDisplay();
  }

  setTimerPreset(seconds) {
    this.timerDuration = seconds;
    this.timerRemaining = seconds;
    this.resetTimer();
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.timerRemaining / 60);
    const secs = this.timerRemaining % 60;
    const str = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const textEl = document.getElementById('timer-text');
    if (textEl) textEl.textContent = str;

    const ring = document.getElementById('timer-progress-ring');
    if (ring) {
      const totalCirc = 276.46;
      const progress = this.timerRemaining / this.timerDuration;
      ring.style.strokeDashoffset = totalCirc * (1 - progress);
    }
  }

  // Breakthrough 3: Interactive Lucky Wheel & Random Picker
  drawLuckyWheel(angle = 0) {
    const canvas = document.getElementById('lucky-wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = width / 2 - 6;

    ctx.clearRect(0, 0, width, height);

    const cls = store.getActiveClass();
    const students = cls ? cls.students : [];
    if (!students || students.length === 0) return;

    const numSlices = students.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    for (let i = 0; i < numSlices; i++) {
      const startA = i * sliceAngle;
      const endA = startA + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.rotate(startA + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3;
      const name = students[i].name.length > 7 ? students[i].name.substring(0, 6) + '…' : students[i].name;
      ctx.fillText(name, radius - 16, 4);
      ctx.restore();
    }

    // Center Hub (Golden Bee Medallion)
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐝', 0, 1);

    ctx.restore();
  }

  openRandomModal() {
    this.openModal(this.randomModal);
    document.getElementById('spotlight-student-name').textContent = '點擊開始旋轉大轉盤';
    document.getElementById('spotlight-sub').textContent = '誰會是下一位幸運發言者？';
    document.getElementById('btn-award-picked').style.display = 'none';
    const spotlightCard = document.getElementById('spotlight-card');
    if (spotlightCard) spotlightCard.style.display = 'none';
    this.drawLuckyWheel(this.wheelAngle || 0);
  }

  spinRandomPicker() {
    if (this.isWheelSpinning) return;
    const cls = store.getActiveClass();
    if (!cls || cls.students.length === 0) return;

    const nameEl = document.getElementById('spotlight-student-name');
    const wrap = document.getElementById('spotlight-monster-wrap');
    const spotlightCard = document.getElementById('spotlight-card');
    const awardBtn = document.getElementById('btn-award-picked');

    this.isWheelSpinning = true;
    if (awardBtn) awardBtn.style.display = 'none';
    if (spotlightCard) spotlightCard.style.display = 'none';
    nameEl.textContent = '轉盤旋轉中...';

    let currentAngle = this.wheelAngle || 0;
    let velocity = 0.45 + Math.random() * 0.25;
    const numSlices = cls.students.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    let lastSliceIdx = -1;

    const animateWheel = () => {
      currentAngle += velocity;
      velocity *= 0.982; // deceleration friction
      this.wheelAngle = currentAngle;
      this.drawLuckyWheel(currentAngle);

      // Determine slice at 12 o'clock pointer (-PI/2)
      const norm = ((-Math.PI / 2 - currentAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const currentSlice = Math.floor(norm / sliceAngle) % numSlices;
      if (currentSlice !== lastSliceIdx) {
        lastSliceIdx = currentSlice;
        if (window.dojoAudio) window.dojoAudio.playTick();
      }

      if (velocity > 0.002) {
        requestAnimationFrame(animateWheel);
      } else {
        this.isWheelSpinning = false;
        const winner = cls.students[currentSlice];
        this.lastPickedStudent = winner;

        nameEl.textContent = `🎉 恭喜 ${winner.name}！`;
        document.getElementById('spotlight-sub').textContent = `座號 ${winner.seatNumber} • 目前累積 ${winner.points} 滴花蜜`;
        if (wrap) {
          wrap.innerHTML = winner.isHatched
            ? (window.monsterEngine ? window.monsterEngine.render(winner.monster, 90) : '🐝')
            : (window.monsterEngine ? window.monsterEngine.renderEgg(winner.name, 90) : '🍯');
        }
        if (spotlightCard) {
          spotlightCard.style.display = 'block';
          spotlightCard.classList.remove('spinning');
        }
        if (awardBtn) awardBtn.style.display = 'inline-flex';

        if (window.dojoAudio) window.dojoAudio.playPositive();
        if (window.dojoConfetti) window.dojoConfetti.burst();
      }
    };

    requestAnimationFrame(animateWheel);
  }

  // Group Maker
  openGroupsMakerModal() {
    this.openModal(this.groupsModal);
    this.shuffleGroups();
  }

  shuffleGroups() {
    const cls = store.getActiveClass();
    if (!cls) return;

    const size = parseInt(document.getElementById('group-size-select').value, 10);
    const shuffled = [...cls.students].sort(() => 0.5 - Math.random());
    const groups = [];

    for (let i = 0; i < shuffled.length; i += size) {
      groups.push(shuffled.slice(i, i + size));
    }

    const container = document.getElementById('group-results-container');
    container.innerHTML = groups.map((grp, idx) => `
      <div class="group-team-card">
        <div class="group-team-header">
          <span>第 ${idx + 1} 組 (${grp.length} 人)</span>
          <span style="font-size: 0.85rem; color: var(--text-muted);">小組合作</span>
        </div>
        ${grp.map(s => `
          <div class="group-member-item">
            <div style="width: 28px; height: 28px;">
              ${s.isHatched ? window.monsterEngine.render(s.monster, 28) : window.monsterEngine.renderEgg(s.name, 28)}
            </div>
            <span>${escapeHTML(s.name)}</span>
          </div>
        `).join('')}
      </div>
    `).join('');

    if (window.dojoAudio) window.dojoAudio.playTick();
  }

  // Noise Meter
  openNoiseModal() {
    this.openModal(this.noiseModal);
    this.startNoiseMeterSimulation();
  }

  startNoiseMeterSimulation() {
    const bar = document.getElementById('noise-bar-fill');
    const emoji = document.getElementById('noise-emoji');
    const tag = document.getElementById('noise-status-tag');
    if (this.noiseInterval) clearInterval(this.noiseInterval);

    this.noiseInterval = setInterval(() => {
      if (this.isMicActive) return;
      // Simulate classroom natural murmur
      const level = Math.floor(20 + Math.random() * 65);
      if (bar) bar.style.width = `${level}%`;

      if (level > this.noiseSensitivity) {
        if (emoji) emoji.textContent = '📢';
        if (tag) {
          tag.textContent = '⚠️ 太吵了！請全班安靜！';
          tag.className = 'noise-status-badge loud';
        }
        if (window.dojoAudio) window.dojoAudio.playNeedsWork();
      } else {
        if (emoji) emoji.textContent = '🤫';
        if (tag) {
          tag.textContent = '課堂環境非常安靜';
          tag.className = 'noise-status-badge quiet';
        }
      }
    }, 800);
  }

  async toggleMicrophone() {
    const btn = document.getElementById('btn-toggle-mic');
    if (this.isMicActive) {
      this.stopMicrophone();
      if (btn) btn.innerHTML = '🎙️ 啟用麥克風即時收音';
      this.startNoiseMeterSimulation();
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const tag = document.getElementById('noise-status-tag');
        if (tag) tag.textContent = '💡 瀏覽器環境未支援音訊輸入，已保持智慧模擬';
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      this.isMicActive = true;
      if (this.noiseInterval) clearInterval(this.noiseInterval);
      if (btn) btn.innerHTML = '🛑 關閉麥克風（切換回模擬）';

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.micAudioCtx = new AudioCtx();
      const source = this.micAudioCtx.createMediaStreamSource(stream);
      const analyser = this.micAudioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const bar = document.getElementById('noise-bar-fill');
      const emoji = document.getElementById('noise-emoji');
      const tag = document.getElementById('noise-status-tag');

      const updateVolume = () => {
        if (!this.isMicActive) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const level = Math.min(100, Math.round((avg / 64) * 100));
        if (bar) bar.style.width = `${level}%`;

        if (level > this.noiseSensitivity) {
          if (emoji) emoji.textContent = '📢';
          if (tag) {
            tag.textContent = '⚠️ 偵測到音量過高！請保持安靜！';
            tag.className = 'noise-status-badge loud';
          }
          if (window.dojoAudio) window.dojoAudio.playNeedsWork();
        } else {
          if (emoji) emoji.textContent = '🤫';
          if (tag) {
            tag.textContent = '🎙️ 麥克風即時收音中：環境良好';
            tag.className = 'noise-status-badge quiet';
          }
        }
        this.micAnimFrame = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      console.warn('Microphone access warning:', err);
      const tag = document.getElementById('noise-status-tag');
      if (tag) tag.textContent = '💡 麥克風未授權，已保持智慧模擬模式';
      this.isMicActive = false;
      if (btn) btn.innerHTML = '🎙️ 啟用麥克風即時收音';
      this.startNoiseMeterSimulation();
    }
  }

  stopMicrophone() {
    this.isMicActive = false;
    if (this.micAnimFrame) {
      cancelAnimationFrame(this.micAnimFrame);
      this.micAnimFrame = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micAudioCtx) {
      try { this.micAudioCtx.close(); } catch (e) {}
      this.micAudioCtx = null;
    }
  }

  stopNoiseMeter() {
    clearInterval(this.noiseInterval);
    this.stopMicrophone();
    const btn = document.getElementById('btn-toggle-mic');
    if (btn) btn.innerHTML = '🎙️ 啟用麥克風即時收音';
  }

  // Class Story View
  renderStories() {
    const list = document.getElementById('story-posts-list');
    const posts = store.state.stories.filter(p => p.classId === store.state.activeClassId);

    list.innerHTML = posts.map(post => `
      <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <div class="post-avatar">👨‍🏫</div>
          <div class="post-meta">
            <h4>${escapeHTML(post.author)}</h4>
            <span>剛剛 • 課堂公開故事</span>
          </div>
        </div>
        <div class="post-content">${escapeHTML(post.content).replace(/\n/g, '<br>')}</div>
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
                  <button class="poll-option-btn ${isSelected ? 'selected' : ''}" data-poll-post="${post.id}" data-poll-opt="${opt.id}" style="position: relative; width: 100%; text-align: left; padding: 10px 14px; border: 1.5px solid ${isSelected ? '#f59e0b' : '#fde68a'}; border-radius: 8px; background: #ffffff; cursor: pointer; overflow: hidden; font-family: inherit;">
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
              總計 ${post.poll.options.reduce((sum, o) => sum + (o.votes || 0), 0)} 票 • 親師生即時同步
            </div>
          </div>
        ` : ''}
        ${post.image ? `<div style="margin-bottom: 14px; border-radius: 8px; overflow: hidden; background: #e6f9f0; padding: 12px; text-align: center;">📷 已上傳班級活動紀錄照片</div>` : ''}
        <div class="post-footer">
          <button class="like-btn ${post.liked ? 'liked' : ''}" data-like-btn="${post.id}">
            <span>${post.liked ? '❤️' : '🤍'}</span>
            <span>${post.likes} 個愛心</span>
          </button>
        </div>
        <div class="comments-list">
          ${post.comments.map(c => `
            <div class="comment-bubble">
              <span class="comment-author">${escapeHTML(c.author)}:</span>
              <span>${escapeHTML(c.text)}</span>
            </div>
          `).join('')}
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <input type="text" placeholder="留言支持孩子與老師..." class="comment-input" data-post-id="${post.id}" style="flex: 1; padding: 6px 12px; border: 1px solid var(--border-light); border-radius: var(--radius-full); font-size: 0.85rem;">
            <button class="btn btn-secondary btn-sm comment-submit-btn" data-post-id="${post.id}">送出</button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach poll voting events
    list.querySelectorAll('[data-poll-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.pollPost;
        const oid = btn.dataset.pollOpt;
        store.voteStoryPoll(pid, oid);
        if (window.dojoAudio) window.dojoAudio.playHoneyDrop();
        this.renderStories();
      });
    });

    // Attach like & comment events
    list.querySelectorAll('[data-like-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        store.togglePostLike(btn.dataset.likeBtn);
        if (window.dojoAudio) window.dojoAudio.playTick();
        this.renderStories();
      });
    });

    const submitComment = (pid) => {
      const input = list.querySelector(`.comment-input[data-post-id="${pid}"]`);
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      store.addPostComment(pid, '林老師', text);
      this.renderStories();
    };

    list.querySelectorAll('.comment-submit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        submitComment(btn.dataset.postId);
      });
    });

    list.querySelectorAll('.comment-input').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitComment(input.dataset.postId);
        }
      });
    });
  }

  // Messages View
  renderMessages() {
    const cls = store.getActiveClass();
    const list = document.getElementById('chat-parents-list');

    list.innerHTML = cls.students.map(s => `
      <div class="chat-user-item ${s.id === this.activeChatStudentId ? 'active' : ''}" data-student-id="${s.id}">
        <div class="post-avatar">👩</div>
        <div>
          <strong style="display: block; font-size: 0.95rem;">${s.parentName || s.name + ' 家長'}</strong>
          <small style="color: var(--text-muted);">學生：${s.name}</small>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.chat-user-item').forEach(item => {
      item.addEventListener('click', () => {
        this.activeChatStudentId = item.dataset.studentId;
        this.renderMessages();
      });
    });

    // Update active chat header
    const activeStudent = cls.students.find(s => s.id === this.activeChatStudentId) || cls.students[0];
    if (activeStudent) {
      document.getElementById('active-chat-parent-name').textContent = activeStudent.parentName || `${activeStudent.name} 家長`;
      document.getElementById('active-chat-student-sub').textContent = `學生：${activeStudent.name} (座號 ${activeStudent.seatNumber})`;
    }

    this.renderChatMessages();
  }

  renderChatMessages() {
    const container = document.getElementById('chat-messages-box');
    const msgs = store.state.messages[this.activeChatStudentId] || [];

    container.innerHTML = msgs.map(m => `
      <div class="chat-bubble ${m.sender}">
        <div>${m.text}</div>
        <small style="display: block; font-size: 0.75rem; opacity: 0.8; margin-top: 4px; text-align: ${m.sender === 'teacher' ? 'right' : 'left'};">
          ${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </small>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  // Portfolios View
  renderPortfolios() {
    const container = document.getElementById('portfolios-list');
    if (!container) return;
    const acts = store.state.portfolios.filter(a => a.classId === store.state.activeClassId);

    if (acts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 24px; background: #fffdf5; border: 2px dashed #fde68a; border-radius: 16px;">
          <div style="font-size: 2.4rem; color: #f59e0b; margin-bottom: 8px;"><i class="fa-solid fa-folder-open"></i></div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 6px;">目前尚無作業活動</h3>
          <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 16px;">點擊上方「發布新作業活動」按鈕，立即為班級小蜜蜂出題！</p>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('btn-create-activity')?.click()"><i class="fa-solid fa-plus"></i> 立即發布作業</button>
        </div>
      `;
      return;
    }

    container.innerHTML = acts.map(act => `
      <div class="post-card" style="border: 1.5px solid #fde68a; border-radius: 16px; padding: 24px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 4px; color: #1e293b;">
              <i class="fa-solid fa-seedling" style="color: #10b981;"></i> ${escapeHTML(act.title)}
            </h3>
            <p style="color: var(--text-muted); font-size: 0.9rem;">${escapeHTML(act.description)}</p>
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; color: #b45309; background: #fef3c7; padding: 4px 12px; border-radius: 9999px; border: 1px solid #fde68a;">
            ${act.submissions ? act.submissions.length : 0} 份作品繳交
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 16px;">
          ${(act.submissions || []).map(sub => `
            <div style="border: 1.5px solid var(--border-light); border-radius: 12px; padding: 14px; background: #fffdf5; display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: #1e293b; font-size: 0.95rem;">${escapeHTML(sub.studentName)}</strong>
                <span style="font-size: 0.75rem; font-weight: 800; padding: 3px 10px; border-radius: var(--radius-full); ${sub.status === 'approved' ? 'background: #dcfce7; color: #166534;' : 'background: #fef3c7; color: #92400e;'}">
                  ${sub.status === 'approved' ? '✓ 已通過審核' : '⏳ 待導師批閱'}
                </span>
              </div>
              <div style="background: #ffffff; border-radius: 8px; overflow: hidden; margin-bottom: 8px; text-align: center; border: 1px solid #fde68a; min-height: 120px; display: flex; align-items: center; justify-content: center;">
                <img src="${sub.drawingData}" alt="學生作品" style="max-width: 100%; max-height: 140px; object-fit: contain;">
              </div>
              <p style="font-size: 0.85rem; color: #334155; margin-bottom: 12px; flex: 1;">${escapeHTML(sub.caption || '無文字心得')}</p>
              ${sub.status !== 'approved' ? `
                <button class="btn btn-primary btn-sm btn-review-sub-card" data-act-id="${act.id}" data-sub-id="${sub.id}" style="width: 100%;">
                  <i class="fa-solid fa-award"></i> 進入批閱與頒發點數
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm btn-review-sub-card" data-act-id="${act.id}" data-sub-id="${sub.id}" style="width: 100%; border: 1px solid #bbf7d0; color: #166534;">
                  <i class="fa-solid fa-circle-check"></i> 查看審核與小紅花
                </button>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-review-sub-card').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openPortfolioReview(btn.dataset.actId, btn.dataset.subId);
      });
    });
  }

  openPortfolioReview(actId, subId) {
    const act = store.state.portfolios.find(a => a.id === actId);
    if (!act) return;
    const sub = act.submissions.find(s => s.id === subId);
    if (!sub) return;

    this.currentReviewTarget = { actId, subId, sub };
    const nameEl = document.getElementById('review-student-name');
    const timeEl = document.getElementById('review-submission-time');
    const imgEl = document.getElementById('review-drawing-img');
    const capEl = document.getElementById('review-student-caption');
    const statusEl = document.getElementById('review-status-badge');
    const commentEl = document.getElementById('review-teacher-comment');

    if (nameEl) nameEl.textContent = sub.studentName;
    if (timeEl) timeEl.textContent = '提交於 ' + new Date(sub.timestamp || Date.now()).toLocaleDateString('zh-TW');
    if (imgEl) imgEl.src = sub.drawingData || '';
    if (capEl) capEl.textContent = sub.caption || '無心得備註';
    if (commentEl) commentEl.value = sub.teacherFeedback || '';
    if (statusEl) {
      statusEl.textContent = sub.status === 'approved' ? '✅ 已通過' : '⏳ 待審核';
      statusEl.style.background = sub.status === 'approved' ? '#dcfce7' : '#fef3c7';
      statusEl.style.color = sub.status === 'approved' ? '#166534' : '#92400e';
    }

    this.openModal(this.portfolioReviewModal);
  }

  confirmApproveReview() {
    if (!this.currentReviewTarget) return;
    const { actId, subId } = this.currentReviewTarget;
    const feedback = document.getElementById('review-teacher-comment')?.value.trim() || '';
    const publishToStory = document.getElementById('review-publish-to-story')?.checked ?? true;

    store.approvePortfolioSubmission(actId, subId, feedback, this.selectedFlowerSticker, publishToStory);
    if (window.dojoAudio) window.dojoAudio.playPositive();
    if (window.dojoConfetti) window.dojoConfetti.burst();
    this.closeModal(this.portfolioReviewModal);
    this.renderPortfolios();
    alert('🎉 已核准學生作品！頒發了 +2 蜂蜜點數與小紅花獎章！');
  }

  returnReview() {
    if (!this.currentReviewTarget) return;
    const { actId, subId } = this.currentReviewTarget;
    const note = prompt('請輸入給予學生的修改建議：', '作品很有想像力！建議可以再豐富背景的花朵細節喔～');
    if (note !== null) {
      store.returnPortfolioSubmission(actId, subId, note);
      if (window.dojoAudio) window.dojoAudio.playTick();
      this.closeModal(this.portfolioReviewModal);
      this.renderPortfolios();
      alert('已退回作品並給予小蜜蜂溫暖建議！');
    }
  }

  submitAddActivity() {
    const title = document.getElementById('input-act-title')?.value.trim();
    const desc = document.getElementById('input-act-desc')?.value.trim() || '';
    const type = document.getElementById('select-act-type')?.value || 'drawing';

    if (!title) {
      alert('請輸入活動作業標題！');
      document.getElementById('input-act-title')?.focus();
      return;
    }

    store.addPortfolioActivity(store.state.activeClassId, title, desc, type);
    if (window.dojoAudio) window.dojoAudio.playPositive();
    if (window.dojoConfetti) window.dojoConfetti.burst();
    if (document.getElementById('input-act-title')) document.getElementById('input-act-title').value = '';
    if (document.getElementById('input-act-desc')) document.getElementById('input-act-desc').value = '';
    this.closeModal(this.addActivityModal);
    this.renderPortfolios();
    alert('✨ 成功發布新課堂作業活動！');
  }

  // Calendar View & Event RSVPs
  renderCalendar() {
    const container = document.getElementById('calendar-events-list');
    if (!container) return;
    const events = calendarManager.getEvents();

    container.innerHTML = events.map(evt => `
      <div style="background: #ffffff; border: 1.5px solid #fde68a; border-radius: 16px; padding: 20px; box-shadow: 0 4px 14px rgba(180, 83, 9, 0.05); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; gap: 18px; align-items: center;">
          <div style="width: 64px; height: 64px; border-radius: 16px; background: #fef3c7; border: 1.5px solid #fde68a; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 900;">
            <span style="font-size: 0.75rem; color: #b45309; text-transform: uppercase;">${evt.date.slice(5, 7)}月</span>
            <span style="font-size: 1.4rem; color: #1e293b; line-height: 1;">${evt.date.slice(8, 10)}</span>
          </div>
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: #1e293b; margin-bottom: 4px;">${evt.title}</h3>
            <div style="display: flex; gap: 12px; font-size: 0.85rem; color: #64748b; margin-bottom: 6px; flex-wrap: wrap;">
              <span><i class="fa-solid fa-clock"></i> ${evt.time}</span>
              <span><i class="fa-solid fa-location-dot"></i> ${evt.location}</span>
            </div>
            <p style="font-size: 0.9rem; color: #334155; line-height: 1.5;">${evt.description}</p>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
          <span style="font-size: 0.85rem; font-weight: 700; color: #b45309; background: #fef3c7; padding: 4px 12px; border-radius: 9999px; border: 1px solid #fde68a;">
            <i class="fa-solid fa-circle-check" style="color: #10b981;"></i> ${evt.rsvpCount} 位家長已回覆參加
          </span>
          <button class="btn ${evt.isRSVPed ? 'btn-secondary' : 'btn-primary'} btn-sm btn-rsvp-toggle" data-event-id="${evt.id}">
            ${evt.isRSVPed ? '已回覆參加 (點擊取消)' : '確認出席 (RSVP)'}
          </button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-rsvp-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        calendarManager.toggleRSVP(btn.dataset.eventId);
        if (window.dojoAudio) window.dojoAudio.playPositive();
        this.renderCalendar();
      });
    });
  }

  submitAddEvent() {
    const title = document.getElementById('event-input-title').value.trim();
    const date = document.getElementById('event-input-date').value;
    const time = document.getElementById('event-input-time').value.trim();
    const location = document.getElementById('event-input-location').value.trim();
    const desc = document.getElementById('event-input-desc').value.trim();

    if (!title || !date) {
      alert('請填寫活動名稱與活動日期！');
      return;
    }

    calendarManager.addEvent(title, date, time, location, desc);
    this.closeModal(this.addEventModal);
    if (window.dojoAudio) window.dojoAudio.playPositive();
    if (window.dojoConfetti) window.dojoConfetti.burst();
    this.renderCalendar();
  }

  // The Meadow (Islands) Canvas Interactive View
  renderDojoIslands() {
    const canvas = document.getElementById('islands-canvas');
    if (!canvas) return;
    if (!this.islandsEngine) {
      this.islandsEngine = new DojoIslands('islands-canvas', {
        playerName: '林老師 (蜂巢導師)',
        playerColor: '#f59e0b',
        playerShape: 'pear',
        playerAccessory: 'horns',
        onCollectGem: () => {
          alert('🍯 恭喜林老師在金蜜泉採集到特級金色蜜糖！全班小蜜蜂士氣大振！');
        }
      });
      this.islandsEngine.start();
    }
  }

  // Big Ideas Video Theater Modal
  openBigIdeasModal() {
    const container = document.getElementById('bigideas-content-wrap');
    if (!container) return;

    const episodes = bigIdeasManager.getEpisodes();
    const active = bigIdeasManager.activeEpisode || episodes[0];

    container.innerHTML = `
      <!-- Episode Pills -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 4px;">
        ${episodes.map(ep => `
          <button class="btn ${ep.id === active.id ? 'btn-primary' : 'btn-secondary'} btn-sm btn-select-ep" data-ep-id="${ep.id}">
            ${ep.icon} ${ep.title.slice(0, 14)}...
          </button>
        `).join('')}
      </div>

      <!-- Animated Video Theater Screen -->
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 24px; color: #ffffff; margin-bottom: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); text-align: center; position: relative; overflow: hidden; border: 1.5px solid #fde68a;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 0.85rem; font-weight: 700; color: #fbbf24; background: rgba(251, 191, 36, 0.15); padding: 4px 12px; border-radius: 9999px;">
            ${active.series}
          </span>
          <span style="font-size: 0.8rem; color: #94a3b8;"><i class="fa-solid fa-clock"></i> ${active.duration}</span>
        </div>

        <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 18px 0;">
          <div class="crew-bee-bobbing" style="width: 72px; height: 72px;">
            <img src="assets/svg/bee-twemoji.svg" alt="Bumble" style="width: 100%; height: 100%; object-fit: contain;">
          </div>
          <div style="font-size: 2.2rem; color: #fbbf24;">✨</div>
          <div class="crew-bee-bobbing" style="width: 68px; height: 68px; animation-delay: 0.5s;">
            <img src="assets/svg/bee-noto.svg" alt="Sunny" style="width: 100%; height: 100%; object-fit: contain;">
          </div>
        </div>

        <h3 style="font-size: 1.3rem; font-weight: 900; color: #ffffff; margin-bottom: 8px;">${active.title}</h3>
        <p style="font-size: 0.95rem; color: #e2e8f0; line-height: 1.6; max-width: 520px; margin: 0 auto 16px;">${active.summary}</p>

        <!-- Golden Takeaway Box -->
        <div style="background: rgba(254, 243, 199, 0.12); border: 1px dashed #fde68a; border-radius: 12px; padding: 12px 18px; margin: 0 auto 16px; max-width: 480px;">
          <strong style="color: #fbbf24; font-size: 1.05rem;">🌟 本集成長金句：</strong>
          <p style="color: #fef3c7; font-weight: 700; margin-top: 4px; font-size: 0.95rem;">${active.keyTakeaway}</p>
        </div>

        <button class="btn btn-primary btn-sm" id="btn-play-bigideas-sim" style="box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
          <i class="fa-solid fa-circle-play"></i> 播放動畫短片音效
        </button>
      </div>

      <!-- Discussion Questions Section -->
      <div style="background: #fffdf5; border: 1.5px solid #fde68a; border-radius: 14px; padding: 18px;">
        <h4 style="font-size: 1.05rem; font-weight: 800; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-comments" style="color: #f59e0b;"></i> 課堂引導討論題：
        </h4>
        <ul style="padding-left: 20px; color: #475569; font-size: 0.9rem; line-height: 1.7;">
          ${active.questions.map(q => `<li style="margin-bottom: 6px;">${q}</li>`).join('')}
        </ul>
      </div>
    `;

    // Bind episode selector buttons
    container.querySelectorAll('.btn-select-ep').forEach(btn => {
      btn.addEventListener('click', () => {
        bigIdeasManager.activeEpisode = bigIdeasManager.getEpisode(btn.dataset.epId);
        if (window.dojoAudio) window.dojoAudio.playTick();
        this.openBigIdeasModal();
      });
    });

    document.getElementById('btn-play-bigideas-sim')?.addEventListener('click', () => {
      if (window.dojoAudio) window.dojoAudio.playFanfare();
      if (window.dojoConfetti) window.dojoConfetti.burst();
      alert('🎬【動畫短片播放中】Bumble 與 Sunny 正帶領全班小蜜蜂探索「還沒」的力量！');
    });

    this.openModal(this.bigIdeasModal);
  }

  openExportReportModal() {
    const cls = store.getActiveClass();
    if (!cls) return;

    const nameEl = document.getElementById('report-class-name');
    const summaryEl = document.getElementById('report-class-summary');
    const tbody = document.getElementById('export-report-tbody');

    if (nameEl) nameEl.textContent = `${cls.name} ‧ 採蜜總評量報表`;
    if (summaryEl) {
      summaryEl.textContent = `全班共 ${cls.students.length} 位小蜜蜂 ‧ 累積總點數 ${cls.totalPoints} 點 ‧ 產出時間：${new Date().toLocaleDateString('zh-TW')}`;
    }

    if (tbody) {
      tbody.innerHTML = cls.students.map(s => {
        const lvl = window.getBeeLevelInfo ? window.getBeeLevelInfo(s.points) : { title: '🥉 採蜜見習小蜂' };
        const attText = s.attendance === 'present' ? '出席' : (s.attendance === 'tardy' ? '遲到' : '缺席');
        const attColor = s.attendance === 'present' ? '#166534' : (s.attendance === 'tardy' ? '#b45309' : '#b91c1c');

        return `
          <tr style="border-bottom: 1px solid #fde68a;">
            <td style="padding: 10px 14px; font-weight: 700; color: #64748b;">${s.seatNumber}</td>
            <td style="padding: 10px 14px;">
              <div style="width: 36px; height: 36px;">
                ${window.beeEngine ? window.beeEngine.renderMonsterSVG(s.monster || {}, 36, s.isHatched) : '🐝'}
              </div>
            </td>
            <td style="padding: 10px 14px; font-weight: 800; color: #1e293b;">${s.name}</td>
            <td style="padding: 10px 14px; font-weight: 800; color: #d97706;">${s.points} 🍯</td>
            <td style="padding: 10px 14px;"><span style="font-weight: 700; font-size: 0.85rem; background: #fffdf5; padding: 2px 8px; border-radius: 6px; border: 1px solid #fde68a;">${lvl.title}</span></td>
            <td style="padding: 10px 14px;"><span style="font-weight: 700; color: ${attColor};">${attText}</span></td>
            <td style="padding: 10px 14px; color: #64748b;">${s.parentName || s.name + ' 家長'}</td>
          </tr>
        `;
      }).join('');
    }

    this.openModal(this.exportReportModal);
    if (window.dojoAudio) window.dojoAudio.playTick();
  }

  downloadReportCSV() {
    const cls = store.getActiveClass();
    if (!cls) return;

    let csv = '\uFEFF座號,學生姓名,累積花蜜點數,成長稱號,今日出勤,家長代表\n';
    cls.students.forEach(s => {
      const lvl = window.getBeeLevelInfo ? window.getBeeLevelInfo(s.points) : { title: '採蜜見習小蜂' };
      const attText = s.attendance === 'present' ? '出席' : (s.attendance === 'tardy' ? '遲到' : '缺席');
      csv += `"${s.seatNumber}","${s.name}","${s.points}","${lvl.title}","${attText}","${s.parentName || s.name + ' 家長'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cls.name}_採蜜評量總表_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (window.dojoAudio) window.dojoAudio.playPositive();
  }

  // Think-Pair-Share
  openThinkPairModal() {
    this.openModal(this.thinkPairModal);
    this.updateThinkPairPromptUI();
    this.updateThinkPairTimerUI();
    if (window.dojoAudio) window.dojoAudio.playTick();
  }

  nextThinkPairPrompt() {
    this.currentPromptIdx = (this.currentPromptIdx + 1) % this.thinkPairPrompts.length;
    this.updateThinkPairPromptUI();
    if (window.dojoAudio) window.dojoAudio.playTick();
  }

  updateThinkPairPromptUI() {
    const textEl = document.getElementById('thinkpair-prompt-text');
    if (textEl) textEl.textContent = this.thinkPairPrompts[this.currentPromptIdx];
  }

  updateThinkPairTimerUI() {
    const display = document.getElementById('thinkpair-timer-display');
    if (!display) return;
    const mins = Math.floor(this.thinkPairRemaining / 60);
    const secs = this.thinkPairRemaining % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  toggleThinkPairTimer() {
    const btn = document.getElementById('btn-thinkpair-timer-toggle');
    if (this.isThinkPairRunning) {
      this.pauseThinkPairTimer();
      if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> 繼續嗡嗡討論';
    } else {
      this.isThinkPairRunning = true;
      if (btn) btn.innerHTML = '<i class="fa-solid fa-pause"></i> 暫停計時';
      this.thinkPairInterval = setInterval(() => {
        if (this.thinkPairRemaining > 0) {
          this.thinkPairRemaining--;
          this.updateThinkPairTimerUI();
        } else {
          this.pauseThinkPairTimer();
          if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> 開始 1 分鐘嗡嗡討論';
          if (window.dojoAudio) window.dojoAudio.playPollenChime();
          if (window.dojoConfetti) window.dojoConfetti.burst(null, null, 60);
          alert('🔔 時間到！小蜜蜂夥伴們請停下嗡嗡聲，準備向全班分享精彩見解！');
        }
      }, 1000);
    }
  }

  pauseThinkPairTimer() {
    this.isThinkPairRunning = false;
    if (this.thinkPairInterval) {
      clearInterval(this.thinkPairInterval);
      this.thinkPairInterval = null;
    }
    const btn = document.getElementById('btn-thinkpair-timer-toggle');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> 開始 1 分鐘嗡嗡討論';
  }

  resetThinkPairTimer() {
    this.pauseThinkPairTimer();
    this.thinkPairRemaining = 60;
    this.updateThinkPairTimerUI();
    if (window.dojoAudio) window.dojoAudio.playTick();
  }

  // Directions Board
  openDirectionsModal() {
    this.openModal(this.directionsModal);
    this.renderDirectionsSteps();
    if (window.dojoAudio) window.dojoAudio.playTick();
  }

  loadDirectionsPreset(presetKey) {
    if (this.directionsPresets[presetKey]) {
      this.currentDirections = JSON.parse(JSON.stringify(this.directionsPresets[presetKey]));
      const titleEl = document.getElementById('directions-title');
      if (titleEl) titleEl.textContent = this.currentDirections.title;
      this.renderDirectionsSteps();
      if (window.dojoAudio) window.dojoAudio.playTick();
    }
  }

  renderDirectionsSteps() {
    const list = document.getElementById('directions-steps-list');
    if (!list) return;

    list.innerHTML = this.currentDirections.steps.map((step, idx) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: ${step.done ? '#ecfdf5' : '#ffffff'}; border: 1.5px solid ${step.done ? '#6ee7b7' : '#fde68a'}; border-radius: 10px; cursor: pointer; transition: all 0.2s;" data-step-idx="${idx}">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="width: 26px; height: 26px; border-radius: 50%; background: ${step.done ? '#10b981' : '#fef3c7'}; color: ${step.done ? '#ffffff' : '#b45309'}; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800;">
            ${step.done ? '✓' : idx + 1}
          </span>
          <span style="font-size: 0.95rem; font-weight: ${step.done ? '600' : '700'}; color: ${step.done ? '#065f46' : '#1e293b'}; text-decoration: ${step.done ? 'line-through' : 'none'};">
            ${escapeHTML(step.text)}
          </span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.8rem; font-weight: 700; color: ${step.done ? '#059669' : '#94a3b8'};">
            ${step.done ? '✓ 已完成' : '待完成'}
          </span>
          <button class="btn-delete-step" data-del-idx="${idx}" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; font-size: 0.9rem;" title="刪除此步驟">&times;</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-step-idx]').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-step')) {
          e.stopPropagation();
          const delIdx = parseInt(e.target.closest('.btn-delete-step').dataset.delIdx, 10);
          this.currentDirections.steps.splice(delIdx, 1);
          if (window.dojoAudio) window.dojoAudio.playTick();
          this.renderDirectionsSteps();
          return;
        }
        const idx = parseInt(item.dataset.stepIdx, 10);
        this.currentDirections.steps[idx].done = !this.currentDirections.steps[idx].done;
        if (window.dojoAudio) {
          if (this.currentDirections.steps[idx].done) {
            window.dojoAudio.playHoneyDrop();
          } else {
            window.dojoAudio.playTick();
          }
        }
        this.renderDirectionsSteps();
      });
    });
  }

  addDirectionsStep(text) {
    this.currentDirections.steps.push({ text, done: false });
    this.renderDirectionsSteps();
    if (window.dojoAudio) window.dojoAudio.playPositive();
  }

  // Breakthrough 2: Giant Point Celebration Splash Overlay
  showCelebrationSplash(target, skill) {
    const splash = document.getElementById('celebration-splash');
    const avatarEl = document.getElementById('splash-avatar');
    const nameEl = document.getElementById('splash-name');
    const badgeEl = document.getElementById('splash-badge');
    if (!splash || !avatarEl || !nameEl || !badgeEl) return;

    let displayName = '';
    let avatarHtml = '';
    const activeCls = store.getActiveClass();

    if (target.type === 'student') {
      const stu = activeCls?.students.find(s => s.id === target.id);
      displayName = stu ? stu.name : (target.name || '優秀小蜜蜂');
      avatarHtml = (stu && stu.isHatched)
        ? (window.monsterEngine ? window.monsterEngine.render(stu.monster, 110) : '🐝')
        : (stu && window.monsterEngine ? window.monsterEngine.renderEgg(stu.name, 110) : '🍯');
    } else if (target.type === 'whole_class') {
      displayName = activeCls ? activeCls.name : '向日葵全班小隊';
      avatarHtml = window.monsterEngine ? window.monsterEngine.renderWholeClassIcon(110) : '🏆';
    } else if (target.type === 'multiple') {
      displayName = `所選 ${target.studentIds?.length || 0} 位蜂巢隊員`;
      avatarHtml = '<div style="font-size: 4rem;">🐝✨</div>';
    }

    nameEl.textContent = displayName;
    avatarEl.innerHTML = avatarHtml;
    const sign = skill.points > 0 ? `+${skill.points}` : `${skill.points}`;
    badgeEl.textContent = `${sign} ${skill.name || '獲得讚賞'}`;
    badgeEl.style.background = skill.points >= 0
      ? 'linear-gradient(135deg, #f59e0b, #d97706)'
      : 'linear-gradient(135deg, #ef4444, #b91c1c)';

    splash.classList.add('active');

    if (this.splashTimeout) clearTimeout(this.splashTimeout);
    this.splashTimeout = setTimeout(() => {
      splash.classList.remove('active');
    }, 2200);

    splash.onclick = () => {
      splash.classList.remove('active');
      if (this.splashTimeout) clearTimeout(this.splashTimeout);
    };
  }

  // Breakthrough 6: Class Honey Milestone Goal Thermometer
  renderMilestoneGoal() {
    const cls = store.getActiveClass();
    if (!cls) return;

    const goal = cls.milestoneGoal || {
      title: '🌻 向日葵花園野餐派對',
      target: 100,
      reward: '全班共享甜蜜點心野餐日！'
    };

    const currentTotal = cls.students.reduce((sum, s) => sum + Math.max(0, s.points || 0), 0);
    const target = goal.target || 100;
    const pct = Math.min(100, Math.round((currentTotal / target) * 100));

    const titleEl = document.getElementById('milestone-goal-title');
    const progTextEl = document.getElementById('milestone-progress-text');
    const barEl = document.getElementById('milestone-progress-bar');

    if (titleEl) titleEl.textContent = `🌻 全班花蜜目標：${goal.title}`;
    if (progTextEl) progTextEl.textContent = `${currentTotal} / ${target} 滴花蜜 (${pct}%)`;
    if (barEl) barEl.style.width = `${pct}%`;
  }

  openMilestoneModal() {
    const cls = store.getActiveClass();
    if (!cls) return;
    const goal = cls.milestoneGoal || {
      title: '🌻 向日葵花園野餐派對',
      target: 100,
      reward: '全班共享甜蜜點心野餐日！'
    };
    const titleInput = document.getElementById('input-milestone-title');
    const targetInput = document.getElementById('input-milestone-target');
    const rewardInput = document.getElementById('input-milestone-reward');

    if (titleInput) titleInput.value = goal.title || '';
    if (targetInput) targetInput.value = goal.target || 100;
    if (rewardInput) rewardInput.value = goal.reward || '';

    const modal = document.getElementById('milestone-goal-modal');
    if (modal) this.openModal(modal);
  }

  saveMilestoneModal() {
    const cls = store.getActiveClass();
    if (!cls) return;
    const title = document.getElementById('input-milestone-title')?.value.trim();
    const target = parseInt(document.getElementById('input-milestone-target')?.value, 10);
    const reward = document.getElementById('input-milestone-reward')?.value.trim();

    store.updateClassMilestoneGoal(cls.id, { title, target, reward });
    const modal = document.getElementById('milestone-goal-modal');
    if (modal) this.closeModal(modal);
    if (window.dojoAudio) window.dojoAudio.playPositive();
    if (window.dojoConfetti) window.dojoConfetti.burst();
    this.renderMilestoneGoal();
  }

  // Security Vault & Database Management
  openSecurityVaultModal() {
    const quota = StorageQuotaManager.getUsage();
    const quotaText = document.getElementById('vault-quota-text');
    const quotaBar = document.getElementById('vault-quota-bar');
    if (quotaText) {
      quotaText.textContent = `${quota.usedKB} KB / ${quota.maxKB} KB (${quota.percentage}%)`;
    }
    if (quotaBar) {
      quotaBar.style.width = `${Math.max(1, quota.percentage)}%`;
      if (quota.isCritical) {
        quotaBar.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)';
      } else if (quota.isWarning) {
        quotaBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
      } else {
        quotaBar.style.background = 'linear-gradient(90deg, #10b981, #059669)';
      }
    }
    this.openModal(this.securityVaultModal);
  }

  exportVaultData() {
    const activeClass = store.getActiveClass();
    const classCode = activeClass ? activeClass.code : 'CREW';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `crew-backup-${classCode}-${timestamp}.json`;
    const payload = JSON.stringify(store.state, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.dojoAudio) window.dojoAudio.playPositive();
  }

  handleVaultImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed || !Array.isArray(parsed.classes) || parsed.classes.length === 0) {
          alert('⚠️ 備份檔案格式無效：必須包含有效的 classes 班級陣列！');
          return;
        }
        // Validate zero-corruption principle: at least one class has students
        const validClass = parsed.classes.find(c => Array.isArray(c.students) && c.students.length > 0);
        if (!validClass) {
          alert('⚠️ 備份檔案無效：未包含任何有效學生名單！');
          return;
        }
        store.state = parsed;
        store.save();
        alert('🎉 資料庫安全還原成功！系統已完整同步最新資料。');
        if (window.dojoAudio) window.dojoAudio.playFanfare();
        if (window.dojoConfetti) window.dojoConfetti.burst();
        this.closeModal(this.securityVaultModal);
        this.renderAll();
      } catch (err) {
        alert('⚠️ 讀取備份檔案失敗：' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  optimizeVaultData() {
    StorageQuotaManager.pruneHistoryIfCrowded(store.state, 20);
    store.save();
    const quota = StorageQuotaManager.getUsage();
    const quotaText = document.getElementById('vault-quota-text');
    const quotaBar = document.getElementById('vault-quota-bar');
    if (quotaText) quotaText.textContent = `${quota.usedKB} KB / ${quota.maxKB} KB (${quota.percentage}%)`;
    if (quotaBar) quotaBar.style.width = `${Math.max(1, quota.percentage)}%`;
    if (window.dojoAudio) window.dojoAudio.playPositive();
    alert('🧹 資料庫快取最佳化完成！已安全維護最佳儲存空間與寫入效能。');
  }

  // Modal helpers
  openModal(modal) {
    if (modal) modal.classList.add('open');
  }

  closeModal(modal) {
    if (!modal) return;
    if (modal === this.timerModal) {
      this.pauseTimer();
    } else if (modal === this.noiseModal) {
      this.stopNoiseMeter();
    } else if (modal === this.thinkPairModal) {
      this.pauseThinkPairTimer();
    }
    modal.classList.remove('open');
  }

  closeTopModal() {
    const openModals = Array.from(document.querySelectorAll('.modal-backdrop.open'));
    if (openModals.length === 0) return false;
    const topModal = openModals[openModals.length - 1];
    this.closeModal(topModal);
    return true;
  }
}

window.teacherController = new TeacherController();
