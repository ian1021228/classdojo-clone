/**
 * Crew Parent Portal Controller
 * Implements child progress reporting, teacher messaging chat, and class story viewing.
 */

import { store } from './store.js';

class ParentController {
  constructor() {
    this.activeClass = store.getActiveClass();
    this.currentChildId = this.activeClass.students[0]?.id || 'stu_1';
    this.currentTab = 'report'; // 'report' | 'chat' | 'story'

    this.init();
  }

  init() {
    this.bindDOMElements();
    this.bindEvents();
    this.renderAll();

    // Store subscription
    store.subscribe(() => {
      this.activeClass = store.getActiveClass();
      this.renderAll();
    });
  }

  bindDOMElements() {
    this.childSelect = document.getElementById('parent-child-select');
    this.tabReport = document.getElementById('tab-parent-report');
    this.tabChat = document.getElementById('tab-parent-chat');
    this.tabStory = document.getElementById('tab-parent-story');

    this.viewReport = document.getElementById('view-parent-report');
    this.viewChat = document.getElementById('view-parent-chat');
    this.viewStory = document.getElementById('view-parent-story');

    this.childMonsterWrap = document.getElementById('parent-child-monster-wrap');
    this.childNameTag = document.getElementById('parent-child-name');
    this.childPointsTag = document.getElementById('parent-child-points-total');
    this.childAttBadge = document.getElementById('parent-att-badge');
  }

  bindEvents() {
    if (this.childSelect) {
      this.childSelect.addEventListener('change', (e) => {
        this.currentChildId = e.target.value;
        this.renderAll();
      });
    }

    this.tabReport?.addEventListener('click', () => this.switchTab('report'));
    this.tabChat?.addEventListener('click', () => this.switchTab('chat'));
    this.tabStory?.addEventListener('click', () => this.switchTab('story'));

    // Mobile nav
    document.getElementById('mob-par-report')?.addEventListener('click', () => this.switchTab('report'));
    document.getElementById('mob-par-chat')?.addEventListener('click', () => this.switchTab('chat'));
    document.getElementById('mob-par-story')?.addEventListener('click', () => this.switchTab('story'));

    // Chat Sending
    document.getElementById('btn-parent-send')?.addEventListener('click', () => {
      const input = document.getElementById('parent-chat-input');
      const text = input.value.trim();
      if (!text) return;
      store.sendMessage(this.currentChildId, 'parent', text);
      input.value = '';
      if (window.dojoAudio) window.dojoAudio.playTick();
      this.renderChat();
    });

    document.getElementById('parent-chat-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-parent-send').click();
    });

    // Open Certificate Modal
    document.getElementById('btn-print-parent-report')?.addEventListener('click', () => {
      this.openCertificateModal();
    });

    document.getElementById('btn-modal-print-cert')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('btn-close-cert')?.addEventListener('click', () => {
      document.getElementById('certificate-modal')?.classList.remove('open');
    });
  }

  openCertificateModal() {
    const child = this.getChild();
    if (!child) return;

    const modal = document.getElementById('certificate-modal');
    const content = document.getElementById('certificate-content');
    if (!modal || !content) return;

    const avatarSvg = (child.isHatched && child.monster)
      ? (window.monsterEngine ? window.monsterEngine.render(child.monster, 100) : '')
      : (window.monsterEngine ? window.monsterEngine.renderEgg(child.name, 100) : '');

    content.innerHTML = `
      <div class="certificate-seal">
        <span>CREW</span>
        <span style="font-size: 1.1rem; line-height: 1;">👑</span>
        <span style="font-size: 0.65rem;">蜂巢認證</span>
      </div>

      <div style="font-size: 2.2rem; margin-bottom: 4px;">🐝</div>
      <h2 class="certificate-header-title">Crew 蜂巢榮譽學習證書</h2>
      <div class="certificate-subtitle">Certificate of Outstanding Honeybee Achievement</div>

      <div style="width: 100px; height: 100px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; background: #ffffff; border-radius: 50%; border: 2px solid #fde68a; box-shadow: 0 4px 12px rgba(180, 83, 9, 0.1);">
        ${avatarSvg}
      </div>

      <p style="font-size: 1.1rem; color: #1e293b; line-height: 1.8; margin-bottom: 20px;">
        茲證明向日葵班小蜂隊員 <strong style="font-size: 1.4rem; color: #b45309; text-decoration: underline; text-underline-offset: 4px;">${child.name}</strong>（座號 ${child.seatNumber}）<br>
        於本階段蜂巢學習社群中積極進取、互助傳粉，成功釀造累積 <strong style="font-size: 1.35rem; color: #d97706;">${child.points} 滴純甜花蜜</strong>，<br>
        展現卓越的學習熱忱與合作精神，特頒發此證書以資表彰與鼓勵！
      </p>

      <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 28px; flex-wrap: wrap;">
        <span style="background: #fef3c7; color: #b45309; font-weight: 800; font-size: 0.85rem; padding: 4px 14px; border-radius: var(--radius-full); border: 1px solid #fde68a;">🌻 勤奮採蜜達人</span>
        <span style="background: #dcfce7; color: #166534; font-weight: 800; font-size: 0.85rem; padding: 4px 14px; border-radius: var(--radius-full); border: 1px solid #bbf7d0;">🌸 傳粉互助典範</span>
        <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 0.85rem; padding: 4px 14px; border-radius: var(--radius-full); border: 1px solid #bae6fd;">🎯 專注飛行標竿</span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 0 20px; color: #475569; font-size: 0.95rem; border-top: 1.5px dashed #fde68a; padding-top: 16px;">
        <div style="text-align: left;">
          <div>授證單位：青青草地實驗小學</div>
          <div>班級：向日葵四年一班 (Crew Sunflowers)</div>
        </div>
        <div style="text-align: right;">
          <div>蜂巢班導師：<strong style="color: #b45309; font-size: 1.1rem;">蜜糖導師 (Teacher Honey)</strong> ✍️</div>
          <div style="color: #94a3b8; font-size: 0.85rem; margin-top: 2px;">頒發日期：${new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>
    `;

    modal.classList.add('open');
    if (window.dojoAudio) window.dojoAudio.playFanfare();
    if (window.dojoConfetti) window.dojoConfetti.burst();
  }

  getChild() {
    return this.activeClass.students.find(s => s.id === this.currentChildId) || this.activeClass.students[0];
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    const tabs = [this.tabReport, this.tabChat, this.tabStory];
    const views = [this.viewReport, this.viewChat, this.viewStory];

    tabs.forEach(t => t?.classList.remove('active'));
    views.forEach(v => { if (v) v.style.display = 'none'; });

    document.querySelectorAll('.mobile-bottom-bar .mobile-nav-item').forEach(m => m.classList.remove('active'));

    if (tabName === 'report') {
      this.tabReport?.classList.add('active');
      document.getElementById('mob-par-report')?.classList.add('active');
      if (this.viewReport) this.viewReport.style.display = 'block';
      this.renderReport();
    } else if (tabName === 'chat') {
      this.tabChat?.classList.add('active');
      document.getElementById('mob-par-chat')?.classList.add('active');
      if (this.viewChat) this.viewChat.style.display = 'block';
      this.renderChat();
    } else if (tabName === 'story') {
      this.tabStory?.classList.add('active');
      document.getElementById('mob-par-story')?.classList.add('active');
      if (this.viewStory) this.viewStory.style.display = 'block';
      this.renderStory();
    }
  }

  renderAll() {
    this.renderChildDropdown();
    if (this.currentTab === 'report') this.renderReport();
    if (this.currentTab === 'chat') this.renderChat();
    if (this.currentTab === 'story') this.renderStory();
  }

  renderChildDropdown() {
    if (!this.childSelect) return;
    this.childSelect.innerHTML = this.activeClass.students.map(s => `
      <option value="${s.id}" ${s.id === this.currentChildId ? 'selected' : ''}>
        🐝 孩子：${s.name} (${s.points} 滴花蜜)
      </option>
    `).join('');
  }

  renderReport() {
    const child = this.getChild();
    if (!child) return;

    if (this.childNameTag) this.childNameTag.textContent = child.name;
    if (this.childPointsTag) this.childPointsTag.textContent = child.points;

    // Bee Avatar
    if (this.childMonsterWrap) {
      if (child.isHatched && child.monster) {
        this.childMonsterWrap.innerHTML = window.monsterEngine ? window.monsterEngine.render(child.monster, 110) : '';
      } else {
        this.childMonsterWrap.innerHTML = window.monsterEngine ? window.monsterEngine.renderEgg(child.name, 110) : '';
      }
    }

    // Attendance label
    const attLabels = {
      present: '✅ 今日準時抵達蜂巢',
      absent: '❌ 今日請假缺席',
      tardy: '⚠️ 今日遲到進巢',
      left_early: '🏃 今日提早離巢'
    };
    if (this.childAttBadge) {
      this.childAttBadge.innerHTML = `<i class="fa-solid fa-check"></i> ${attLabels[child.attendance || 'present'] || '✅ 今日準時抵達蜂巢'}`;
    }

    // Update Level Badge
    const lvlBadge = document.getElementById('parent-level-badge');
    if (lvlBadge && window.getBeeLevelInfo) {
      const lvl = window.getBeeLevelInfo(child.points);
      lvlBadge.textContent = lvl.title;
    }

    // Feedback timeline
    const timelineWrap = document.getElementById('parent-feedback-timeline');
    if (!timelineWrap) return;

    if (!child.history || child.history.length === 0) {
      timelineWrap.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
          尚未有近期的反饋紀錄。蜜糖導師將在蜂巢課堂即時記錄孩子的成長點滴！
        </div>
      `;
      return;
    }

    timelineWrap.innerHTML = child.history.map(item => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: #fffdf5; border-radius: 12px; border-left: 4px solid ${item.points >= 0 ? '#f59e0b' : '#ef4444'}; border: 1px solid #fde68a;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="font-size: 1.6rem;">${item.icon || (item.points >= 0 ? '🍯' : '💨')}</span>
          <div>
            <strong style="font-size: 1rem; color: #1e293b; display: block;">${item.skillName}</strong>
            <small style="color: #64748b;">${item.note || '課堂認真表現，獲得導師肯定'}</small>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; font-size: 1.15rem; color: ${item.points >= 0 ? '#d97706' : '#ef4444'};">
            ${item.points >= 0 ? '+' + item.points : item.points} 滴花蜜
          </div>
          <small style="color: #94a3b8; font-size: 0.75rem;">${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
      </div>
    `).join('');
  }

  renderChat() {
    const container = document.getElementById('parent-chat-messages-box');
    if (!container) return;
    const msgs = store.state.messages[this.currentChildId] || [];

    container.innerHTML = msgs.map(m => `
      <div class="chat-bubble ${m.sender}">
        <div>${m.text}</div>
        <small style="display: block; font-size: 0.75rem; opacity: 0.8; margin-top: 4px; text-align: ${m.sender === 'parent' ? 'right' : 'left'};">
          ${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </small>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  renderStory() {
    const list = document.getElementById('parent-story-posts');
    if (!list) return;

    const posts = store.state.stories.filter(p => p.classId === this.activeClass.id);
    list.innerHTML = posts.map(post => `
      <div class="post-card" style="border: 1.5px solid #fde68a; background: #ffffff;">
        <div class="post-header">
          <div class="post-avatar" style="background: #fef3c7; border: 1.5px solid #fde68a; font-size: 1.3rem;">🍯</div>
          <div class="post-meta">
            <h4>${post.author}</h4>
            <span style="color: #64748b;">蜂巢課堂公告</span>
          </div>
        </div>
        <div class="post-content" style="color: #334155; line-height: 1.6;">${post.content}</div>
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
                  <button class="poll-option-btn ${isSelected ? 'selected' : ''}" data-parent-poll-post="${post.id}" data-parent-poll-opt="${opt.id}" style="position: relative; width: 100%; text-align: left; padding: 10px 14px; border: 1.5px solid ${isSelected ? '#f59e0b' : '#fde68a'}; border-radius: 8px; background: #ffffff; cursor: pointer; overflow: hidden; font-family: inherit;">
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
              總計 ${post.poll.options.reduce((sum, o) => sum + (o.votes || 0), 0)} 票 • 家長與教師即時同步
            </div>
          </div>
        ` : ''}
        <div class="post-footer">
          <button class="like-btn ${post.liked ? 'liked' : ''}" data-parent-like="${post.id}">
            <span>${post.liked ? '❤️' : '🤍'}</span>
            <span>${post.likes} 個愛心點讚</span>
          </button>
        </div>
        <div class="comments-list">
          ${post.comments.map(c => `
            <div class="comment-bubble">
              <span class="comment-author">${c.author}:</span>
              <span>${c.text}</span>
            </div>
          `).join('')}
          <div style="display: flex; gap: 8px; margin-top: 10px;">
            <input type="text" placeholder="以家長身份留言..." class="comment-input" data-post-id="${post.id}" style="flex: 1; padding: 8px 14px; border: 1.5px solid #e2e8f0; border-radius: var(--radius-full); font-size: 0.85rem; outline: none;">
            <button class="btn btn-secondary btn-sm comment-submit-btn" data-post-id="${post.id}"><i class="fa-solid fa-paper-plane"></i> 留言</button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach poll voting events
    list.querySelectorAll('[data-parent-poll-opt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.parentPollPost;
        const oid = btn.dataset.parentPollOpt;
        store.voteStoryPoll(pid, oid);
        if (window.dojoAudio) window.dojoAudio.playHoneyDrop();
        this.renderStory();
      });
    });

    list.querySelectorAll('[data-parent-like]').forEach(btn => {
      btn.addEventListener('click', () => {
        store.togglePostLike(btn.dataset.parentLike);
        if (window.dojoAudio) window.dojoAudio.playTick();
        this.renderStory();
      });
    });

    list.querySelectorAll('.comment-submit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = btn.dataset.postId;
        const input = list.querySelector(`.comment-input[data-post-id="${pid}"]`);
        const text = input.value.trim();
        if (!text) return;
        const child = this.getChild();
        const author = `${child.name} 家長`;
        store.addPostComment(pid, author, text);
        this.renderStory();
      });
    });
  }
}

window.parentController = new ParentController();
