/**
 * ClassDojo Parent Portal Controller
 * Implements child progress reporting, teacher messaging chat, and class story viewing.
 */

import { store } from './store.js';

class ParentController {
  constructor() {
    this.activeClass = store.getActiveClass();
    this.currentChildId = 'stu_1';
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
    this.childSelect.addEventListener('change', (e) => {
      this.currentChildId = e.target.value;
      this.renderAll();
    });

    this.tabReport.addEventListener('click', () => this.switchTab('report'));
    this.tabChat.addEventListener('click', () => this.switchTab('chat'));
    this.tabStory.addEventListener('click', () => this.switchTab('story'));

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

    // Print Report Button
    document.getElementById('btn-print-parent-report')?.addEventListener('click', () => {
      window.print();
    });
  }

  getChild() {
    return this.activeClass.students.find(s => s.id === this.currentChildId) || this.activeClass.students[0];
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    [this.tabReport, this.tabChat, this.tabStory].forEach(t => t.classList.remove('active'));
    [this.viewReport, this.viewChat, this.viewStory].forEach(v => v.style.display = 'none');

    document.querySelectorAll('.mobile-bottom-bar .mobile-nav-item').forEach(m => m.classList.remove('active'));

    if (tabName === 'report') {
      this.tabReport.classList.add('active');
      document.getElementById('mob-par-report')?.classList.add('active');
      this.viewReport.style.display = 'block';
      this.renderReport();
    } else if (tabName === 'chat') {
      this.tabChat.classList.add('active');
      document.getElementById('mob-par-chat')?.classList.add('active');
      this.viewChat.style.display = 'block';
      this.renderChat();
    } else if (tabName === 'story') {
      this.tabStory.classList.add('active');
      document.getElementById('mob-par-story')?.classList.add('active');
      this.viewStory.style.display = 'block';
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
    this.childSelect.innerHTML = this.activeClass.students.map(s => `
      <option value="${s.id}" ${s.id === this.currentChildId ? 'selected' : ''}>
        👦 孩子：${s.name} (${s.points} 點)
      </option>
    `).join('');
  }

  renderReport() {
    const child = this.getChild();
    if (!child) return;

    this.childNameTag.textContent = child.name;
    this.childPointsTag.textContent = child.points;

    // Monster Avatar
    if (child.isHatched && child.monster) {
      this.childMonsterWrap.innerHTML = window.monsterEngine ? window.monsterEngine.render(child.monster, 110) : '';
    } else {
      this.childMonsterWrap.innerHTML = window.monsterEngine ? window.monsterEngine.renderEgg(child.name, 110) : '';
    }

    // Attendance label
    const attLabels = {
      present: '✅ 今日準時出席',
      absent: '❌ 今日缺席',
      tardy: '⚠️ 今日遲到',
      left_early: '🏃 今日早退'
    };
    this.childAttBadge.textContent = attLabels[child.attendance || 'present'] || '✅ 今日出席正常';

    // Feedback timeline
    const timelineWrap = document.getElementById('parent-feedback-timeline');
    if (!child.history || child.history.length === 0) {
      timelineWrap.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
          尚未有近期的反饋紀錄。老師將在課堂即時記錄孩子的成長點滴！
        </div>
      `;
      return;
    }

    timelineWrap.innerHTML = child.history.map(item => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: #f8fafc; border-radius: 12px; border-left: 4px solid ${item.points >= 0 ? '#00d27a' : '#ff4d6d'};">
        <div style="display: flex; align-items: center; gap: 14px;">
          <span style="font-size: 1.6rem;">${item.icon || (item.points >= 0 ? '⭐' : '⏳')}</span>
          <div>
            <strong style="font-size: 1rem; color: var(--text-main); display: block;">${item.skillName}</strong>
            <small style="color: var(--text-muted);">${item.note || '課堂認真表現，獲得林老師肯定'}</small>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; font-size: 1.15rem; color: ${item.points >= 0 ? 'var(--dojo-primary)' : 'var(--dojo-red)'};">
            ${item.points >= 0 ? '+' + item.points : item.points} 點
          </div>
          <small style="color: var(--text-light); font-size: 0.75rem;">${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
      </div>
    `).join('');
  }

  renderChat() {
    const container = document.getElementById('parent-chat-messages-box');
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
          <button class="like-btn ${post.liked ? 'liked' : ''}" data-parent-like="${post.id}">
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
            <input type="text" placeholder="以家長身份留言..." class="comment-input" data-post-id="${post.id}" style="flex: 1; padding: 6px 12px; border: 1px solid var(--border-light); border-radius: var(--radius-full); font-size: 0.85rem;">
            <button class="btn btn-secondary btn-sm comment-submit-btn" data-post-id="${post.id}">留言</button>
          </div>
        </div>
      </div>
    `).join('');

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
