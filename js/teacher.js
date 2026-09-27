import { store } from './store.js';
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
    this.micAnimFrame = null;

    this.init();
  }

  init() {
    this.bindDOMElements();
    this.bindEvents();
    this.renderAll();

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
      const prompts = [
        '「如果你有一種超能力，你想用它來解決生活中的什麼問題？」',
        '「課堂實驗中，水分子是怎麼運動的？請和夥伴互相說明 30 秒！」',
        '「回想今天最讓你開心的一件事，並給身邊的夥伴一個擊掌！」'
      ];
      const p = prompts[Math.floor(Math.random() * prompts.length)];
      alert(`💡 思考-配對-分享 (Think-Pair-Share):\n\n${p}\n\n請給學生 1 分鐘互相分享討論！`);
    });
    document.getElementById('tk-card-music')?.addEventListener('click', () => {
      if (window.dojoAudio) {
        window.dojoAudio.playFanfare();
        alert('🎵 專注提示音已播放！課堂輕快專注節奏啟動。');
      }
    });

    // Timer Modal Controls
    document.getElementById('btn-close-timer')?.addEventListener('click', () => {
      this.pauseTimer();
      this.closeModal(this.timerModal);
    });
    document.getElementById('btn-timer-toggle')?.addEventListener('click', () => this.toggleTimer());
    document.getElementById('btn-timer-reset')?.addEventListener('click', () => this.resetTimer());
    document.querySelectorAll('.preset-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const secs = parseInt(e.target.dataset.seconds, 10);
        this.setTimerPreset(secs);
      });
    });

    // Random Modal Controls
    document.getElementById('btn-close-random')?.addEventListener('click', () => this.closeModal(this.randomModal));
    document.getElementById('btn-spin-random')?.addEventListener('click', () => this.spinRandomPicker());
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

    // Class Story Posting & Poll Creator
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
      <option value="${c.id}" ${c.id === store.state.activeClassId ? 'selected' : ''}>${c.name}</option>
    `).join('') + `<option value="__add_new__">+ 新增班級...</option>`;
  }

  renderHeader() {
    const cls = store.getActiveClass();
    if (!cls) return;
    this.classDisplayName.textContent = cls.name;
    this.classStudentCount.textContent = cls.students.length;
    this.classCodeTag.textContent = cls.code;
    this.classBadgeIcon.textContent = cls.icon || '🎒';
  }

  // Render Students Grid
  renderStudents() {
    const cls = store.getActiveClass();
    if (!cls) return;

    let html = '';

    // 1. Whole Class Card
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

    // 2. Student Cards
    cls.students.forEach(student => {
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
          <div class="student-name">${student.name}</div>
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

    this.studentsGrid.innerHTML = html;

    // Attach card event listeners
    document.getElementById('card-whole-class').addEventListener('click', () => {
      if (this.isAttendanceMode || this.isMultipleMode) return;
      this.openSkillsModal({ type: 'whole_class', name: '全班同學' });
    });

    document.getElementById('card-add-student').addEventListener('click', () => {
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

  // Render Groups Grid
  renderGroups() {
    const cls = store.getActiveClass();
    if (!cls || !cls.groups) return;

    this.groupsGrid.innerHTML = cls.groups.map(grp => {
      const members = grp.studentIds.map(id => cls.students.find(s => s.id === id)).filter(Boolean);
      return `
        <div class="group-team-card" style="cursor: pointer;" data-group-id="${grp.id}">
          <div class="group-team-header">
            <span>${grp.name}</span>
            <span class="points-badge" style="position: static;">${grp.points}</span>
          </div>
          <div style="display: flex; gap: 8px; margin: 12px 0;">
            ${members.map(m => `
              <div style="width: 44px; height: 44px;">
                ${m.isHatched ? window.monsterEngine.render(m.monster, 44) : window.monsterEngine.renderEgg(m.name, 44)}
              </div>
            `).join('')}
          </div>
          <button class="btn btn-outline-primary btn-sm" style="width: 100%;">⭐ 給小組反饋</button>
        </div>
      `;
    }).join('') + `
      <div class="add-student-card" id="card-create-group">
        <div class="add-student-icon">👥</div>
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
        <span class="skill-label">${skill.name}</span>
      </button>
    `).join('');

    negContainer.innerHTML = cls.skills.needsWork.map(skill => `
      <button class="skill-btn needs-work" data-skill-id="${skill.id}">
        <div class="skill-icon-wrap">
          <span>${skill.icon}</span>
          <span class="skill-pts-tag">${skill.points}</span>
        </div>
        <span class="skill-label">${skill.name}</span>
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

      // Audio & Confetti
      if (skill.points > 0) {
        if (this.awardTarget.type === 'whole_class') {
          if (window.dojoAudio) window.dojoAudio.playFanfare();
        } else {
          if (window.dojoAudio) window.dojoAudio.playPositive();
        }
        if (window.dojoConfetti) window.dojoConfetti.burst();
      } else {
        if (window.dojoAudio) window.dojoAudio.playNeedsWork();
      }

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

  // Random Picker Spotlight
  openRandomModal() {
    this.openModal(this.randomModal);
    document.getElementById('spotlight-student-name').textContent = '點擊開始抽籤';
    document.getElementById('spotlight-sub').textContent = '誰會是下一位幸運發言者？';
    document.getElementById('btn-award-picked').style.display = 'none';
    document.getElementById('spotlight-monster-wrap').innerHTML = window.monsterEngine.renderWholeClassIcon(90);
  }

  spinRandomPicker() {
    const cls = store.getActiveClass();
    if (!cls || cls.students.length === 0) return;

    const card = document.getElementById('spotlight-card');
    const nameEl = document.getElementById('spotlight-student-name');
    const wrap = document.getElementById('spotlight-monster-wrap');
    const awardBtn = document.getElementById('btn-award-picked');

    card.classList.add('spinning');
    awardBtn.style.display = 'none';

    let count = 0;
    const maxSpins = 20;
    const timer = setInterval(() => {
      count++;
      const randomIdx = Math.floor(Math.random() * cls.students.length);
      const tempStudent = cls.students[randomIdx];

      nameEl.textContent = tempStudent.name;
      wrap.innerHTML = tempStudent.isHatched ? window.monsterEngine.render(tempStudent.monster, 90) : window.monsterEngine.renderEgg(tempStudent.name, 90);

      if (window.dojoAudio) window.dojoAudio.playTick();

      if (count >= maxSpins) {
        clearInterval(timer);
        card.classList.remove('spinning');
        this.lastPickedStudent = tempStudent;

        nameEl.textContent = `🎉 ${tempStudent.name}！`;
        document.getElementById('spotlight-sub').textContent = `座號 ${tempStudent.seatNumber} • 目前累積 ${tempStudent.points} 點`;
        awardBtn.style.display = 'inline-flex';

        if (window.dojoAudio) window.dojoAudio.playPositive();
        if (window.dojoConfetti) window.dojoConfetti.burst();
      }
    }, 100);
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
            <span>${s.name}</span>
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
            <h4>${post.author}</h4>
            <span>剛剛 • 課堂公開故事</span>
          </div>
        </div>
        <div class="post-content">${post.content}</div>
        ${post.poll ? `
          <div class="hive-poll-box" style="margin: 14px 0; padding: 14px 16px; background: #fffdf5; border: 1.5px solid #fde68a; border-radius: 12px;">
            <div style="font-weight: 800; font-size: 0.95rem; color: #78350f; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span>📊</span>
              <span>${post.poll.question}</span>
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
                        ${isSelected ? '✅ ' : '⚪ '}${opt.text}
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
              <span class="comment-author">${c.author}:</span>
              <span>${c.text}</span>
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

    list.querySelectorAll('.comment-submit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.postId;
        const input = list.querySelector(`.comment-input[data-post-id="${pid}"]`);
        const text = input.value.trim();
        if (!text) return;
        store.addPostComment(pid, '林老師', text);
        this.renderStories();
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
    const acts = store.state.portfolios.filter(a => a.classId === store.state.activeClassId);

    container.innerHTML = acts.map(act => `
      <div class="post-card">
        <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 6px;">📌 ${act.title}</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">${act.description}</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
          ${act.submissions.map(sub => `
            <div style="border: 1px solid var(--border-light); border-radius: 12px; padding: 12px; background: #fafbfc;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong>${sub.studentName}</strong>
                <span style="font-size: 0.8rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); ${sub.status === 'approved' ? 'background: #dcfce7; color: #166534;' : 'background: #fef3c7; color: #92400e;'}">
                  ${sub.status === 'approved' ? '✅ 已通過' : '⏳ 待審核'}
                </span>
              </div>
              <div style="background: #ffffff; border-radius: 8px; overflow: hidden; margin-bottom: 8px; text-align: center;">
                <img src="${sub.drawingData}" alt="學生作品" style="max-width: 100%; height: 140px; object-fit: contain;">
              </div>
              <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 10px;">${sub.caption}</p>
              ${sub.status !== 'approved' ? `
                <button class="btn btn-primary btn-sm btn-approve-sub" data-act-id="${act.id}" data-sub-id="${sub.id}" style="width: 100%;">
                  👍 審核通過並給予點數
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-approve-sub').forEach(btn => {
      btn.addEventListener('click', () => {
        store.approvePortfolioSubmission(btn.dataset.actId, btn.dataset.subId);
        if (window.dojoAudio) window.dojoAudio.playPositive();
        if (window.dojoConfetti) window.dojoConfetti.burst();
        this.renderPortfolios();
      });
    });
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

  // Modal helpers
  openModal(modal) {
    if (modal) modal.classList.add('open');
  }

  closeModal(modal) {
    if (modal) modal.classList.remove('open');
  }
}

window.teacherController = new TeacherController();
