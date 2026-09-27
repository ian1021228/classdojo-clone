/**
 * ClassDojo Islands - Interactive Canvas 2D Playground Engine
 * Allows students and teachers to explore a virtual classroom island with their cute Dojo monsters!
 * Supports keyboard (WASD/Arrows), mouse click-to-move, and mobile touch joystick.
 */

export class DojoIslands {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.options = options;

    this.width = this.canvas.width = options.width || 800;
    this.height = this.canvas.height = options.height || 500;

    // Player monster
    this.player = {
      x: 380,
      y: 260,
      targetX: 380,
      targetY: 260,
      speed: 3.5,
      name: options.playerName || '我 (Player)',
      color: options.playerColor || '#f59e0b',
      bodyShape: options.playerShape || 'round',
      accessory: options.playerAccessory || 'horns',
      bounce: 0,
      bounceSpeed: 0.15,
      moving: false
    };

    // Classmate NPC little bees wandering on meadow
    this.classmates = [
      { name: 'Beyoncé', x: 260, y: 200, targetX: 260, targetY: 200, color: '#f59e0b', bubble: '向日葵花蜜好香甜！🌻', bubbleTimer: 180 },
      { name: 'Denzel', x: 500, y: 220, targetX: 500, targetY: 220, color: '#eab308', bubble: '一起去金蜜泉許願吧！🍯', bubbleTimer: 120 },
      { name: 'Jennifer', x: 420, y: 340, targetX: 420, targetY: 340, color: '#ec4899', bubble: '我採集到 3 滴花蜜！✨', bubbleTimer: 240 },
      { name: 'Justin', x: 300, y: 320, targetX: 300, targetY: 320, color: '#0ea5e9', bubble: '大家飛行隊形好整齊！🐝', bubbleTimer: 90 },
      { name: 'Leonardo', x: 550, y: 310, targetX: 550, targetY: 310, color: '#10b981', bubble: '蜂巢花園太好玩了！🌸', bubbleTimer: 300 }
    ];

    // Interactive hotspots
    this.hotspots = [
      { id: 'fountain', name: '🍯 蜂巢金蜜泉', x: 400, y: 160, radius: 45, icon: '🍯', collected: false },
      { id: 'campfire', name: '⛺ 蜂群故事營', x: 220, y: 260, radius: 40, icon: '🔥' },
      { id: 'sunflowers', name: '🌻 向日葵花圃', x: 580, y: 240, radius: 40, icon: '🌻' }
    ];

    this.keys = {};
    this.running = false;

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Canvas click-to-move
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.player.targetX = (e.clientX - rect.left) * scaleX;
      this.player.targetY = (e.clientY - rect.top) * scaleY;
    });

    // Touch support for mobile 393x852
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.player.targetX = (touch.clientX - rect.left) * scaleX;
      this.player.targetY = (touch.clientY - rect.top) * scaleY;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.player.targetX = (touch.clientX - rect.left) * scaleX;
      this.player.targetY = (touch.clientY - rect.top) * scaleY;
    }, { passive: false });
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.loop();
    }
  }

  stop() {
    this.running = false;
  }

  loop() {
    if (!this.running) return;
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  update() {
    // Keyboard movement
    let dx = 0;
    let dy = 0;
    if (this.keys['arrowleft'] || this.keys['a']) dx -= this.player.speed;
    if (this.keys['arrowright'] || this.keys['d']) dx += this.player.speed;
    if (this.keys['arrowup'] || this.keys['w']) dy -= this.player.speed;
    if (this.keys['arrowdown'] || this.keys['s']) dy += this.player.speed;

    if (dx !== 0 || dy !== 0) {
      this.player.x += dx;
      this.player.y += dy;
      this.player.targetX = this.player.x;
      this.player.targetY = this.player.y;
      this.player.moving = true;
    } else {
      // Move towards click target
      const distTargetX = this.player.targetX - this.player.x;
      const distTargetY = this.player.targetY - this.player.y;
      const dist = Math.hypot(distTargetX, distTargetY);

      if (dist > 4) {
        this.player.x += (distTargetX / dist) * this.player.speed;
        this.player.y += (distTargetY / dist) * this.player.speed;
        this.player.moving = true;
      } else {
        this.player.moving = false;
      }
    }

    // Boundary constraints (stay within island)
    this.player.x = Math.max(120, Math.min(this.width - 120, this.player.x));
    this.player.y = Math.max(90, Math.min(this.height - 90, this.player.y));

    // Bounce animation
    if (this.player.moving) {
      this.player.bounce += this.player.bounceSpeed;
    } else {
      this.player.bounce = Math.sin(Date.now() / 300) * 0.15;
    }

    // Update classmate AI wandering
    this.classmates.forEach(c => {
      c.bubbleTimer--;
      if (c.bubbleTimer <= 0) {
        c.bubbleTimer = 200 + Math.random() * 200;
        c.targetX = c.x + (Math.random() - 0.5) * 80;
        c.targetY = c.y + (Math.random() - 0.5) * 80;
        c.targetX = Math.max(160, Math.min(this.width - 160, c.targetX));
        c.targetY = Math.max(120, Math.min(this.height - 120, c.targetY));
      }

      const cdx = c.targetX - c.x;
      const cdy = c.targetY - c.y;
      const cdist = Math.hypot(cdx, cdy);
      if (cdist > 2) {
        c.x += (cdx / cdist) * 0.8;
        c.y += (cdy / cdist) * 0.8;
      }
    });

    // Check interaction with hotspots
    this.hotspots.forEach(h => {
      const dist = Math.hypot(this.player.x - h.x, this.player.y - h.y);
      if (dist < h.radius) {
        if (h.id === 'fountain' && !h.collected) {
          h.collected = true;
          if (window.dojoAudio) window.dojoAudio.playFanfare();
          if (window.dojoConfetti) window.dojoConfetti.burst(h.x, h.y);
          if (this.options.onCollectGem) this.options.onCollectGem();
        }
      }
    });
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Water Background with gentle waves
    const time = Date.now() / 1000;
    this.ctx.fillStyle = '#60a5fa';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Wave ripples
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const wy = 40 + i * 80;
      this.ctx.beginPath();
      this.ctx.moveTo(0, wy + Math.sin(time + i) * 6);
      for (let x = 0; x < this.width; x += 40) {
        this.ctx.quadraticCurveTo(x + 20, wy + Math.sin(time + x * 0.02) * 8, x + 40, wy + Math.sin(time + i) * 6);
      }
      this.ctx.stroke();
    }

    // 2. Sand Beach
    this.ctx.fillStyle = '#fde68a';
    this.ctx.beginPath();
    this.ctx.ellipse(this.width / 2, this.height / 2 + 10, this.width * 0.44, this.height * 0.42, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 3. Lush Green Grass Island
    this.ctx.fillStyle = '#4ade80';
    this.ctx.beginPath();
    this.ctx.ellipse(this.width / 2, this.height / 2 + 10, this.width * 0.38, this.height * 0.35, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner darker green accents
    this.ctx.fillStyle = '#22c55e';
    this.ctx.beginPath();
    this.ctx.ellipse(this.width / 2, this.height / 2 + 10, this.width * 0.32, this.height * 0.28, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Cobblestone path
    this.ctx.strokeStyle = '#e2e8f0';
    this.ctx.lineWidth = 14;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(220, 260);
    this.ctx.quadraticCurveTo(380, 240, 400, 160);
    this.ctx.quadraticCurveTo(460, 240, 580, 240);
    this.ctx.stroke();

    // 4. Render Hotspots
    this.hotspots.forEach(h => {
      // Hotspot glow ring
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Hotspot icon & label
      this.ctx.font = '28px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(h.icon, h.x, h.y - 2);

      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillText(h.name, h.x, h.y + 28);
    });

    // Palm trees
    this.renderTree(170, 150);
    this.renderTree(620, 160);
    this.renderTree(200, 360);
    this.renderTree(590, 350);

    // 5. Render Classmates
    this.classmates.forEach(c => {
      this.renderMonsterSprite(c.x, c.y, c.color, c.name, 0.75);
      // Speech Bubble
      if (c.bubble) {
        this.ctx.font = 'bold 11px sans-serif';
        const tw = this.ctx.measureText(c.bubble).width;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.roundRect(c.x - tw / 2 - 8, c.y - 48, tw + 16, 22, 10);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#1e293b';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(c.bubble, c.x, c.y - 37);
      }
    });

    // 6. Render Player
    const bounceOffset = Math.sin(this.player.bounce * 8) * 4;
    this.renderMonsterSprite(this.player.x, this.player.y + bounceOffset, this.player.color, `🌟 ${this.player.name}`, 0.95, true);
  }

  renderTree(x, y) {
    // Trunk
    this.ctx.fillStyle = '#92400e';
    this.ctx.fillRect(x - 4, y, 8, 24);
    // Leaves
    this.ctx.fillStyle = '#15803d';
    this.ctx.beginPath();
    this.ctx.arc(x, y - 6, 18, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(x - 10, y + 2, 14, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(x + 10, y + 2, 14, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderMonsterSprite(x, y, color, name, scale = 1, isPlayer = false) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);

    const wingFlap = Math.sin(Date.now() / 70) * 0.35;

    // Translucent fluttering wings
    this.ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
    this.ctx.strokeStyle = '#bae6fd';
    this.ctx.lineWidth = 1.2;

    // Left Wing
    this.ctx.save();
    this.ctx.translate(-8, -12);
    this.ctx.rotate(-0.4 + wingFlap);
    this.ctx.beginPath();
    this.ctx.ellipse(0, -10, 8, 14, -0.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();

    // Right Wing
    this.ctx.save();
    this.ctx.translate(8, -12);
    this.ctx.rotate(0.4 - wingFlap);
    this.ctx.beginPath();
    this.ctx.ellipse(0, -10, 8, 14, 0.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 20, 16, 5, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Antennae
    this.ctx.strokeStyle = '#334155';
    this.ctx.lineWidth = 1.6;
    this.ctx.beginPath();
    this.ctx.moveTo(-5, -14);
    this.ctx.quadraticCurveTo(-10, -24, -12, -22);
    this.ctx.moveTo(5, -14);
    this.ctx.quadraticCurveTo(10, -24, 12, -22);
    this.ctx.stroke();

    this.ctx.fillStyle = '#f59e0b';
    this.ctx.beginPath();
    this.ctx.arc(-12, -22, 2.5, 0, Math.PI * 2);
    this.ctx.arc(12, -22, 2.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Bee Oval Body
    this.ctx.fillStyle = color || '#f59e0b';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Honeybee Stripes
    this.ctx.fillStyle = '#1e293b';
    this.ctx.beginPath();
    this.ctx.roundRect(-4, -13, 8, 26, 3);
    this.ctx.fill();

    // Eyes
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(-8, -2, 4.5, 0, Math.PI * 2);
    this.ctx.arc(2, -2, 4.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Pupils
    this.ctx.fillStyle = '#1e293b';
    this.ctx.beginPath();
    this.ctx.arc(-7, -2, 2.2, 0, Math.PI * 2);
    this.ctx.arc(3, -2, 2.2, 0, Math.PI * 2);
    this.ctx.fill();

    // Smile
    this.ctx.strokeStyle = '#1e293b';
    this.ctx.lineWidth = 1.6;
    this.ctx.beginPath();
    this.ctx.arc(-2, 4, 3.5, 0, Math.PI);
    this.ctx.stroke();

    // Player Crown / Sparkle
    if (isPlayer) {
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.font = '14px sans-serif';
      this.ctx.fillText('👑', 0, -24);
    }

    this.ctx.restore();

    // Name tag
    this.ctx.font = isPlayer ? 'bold 12px sans-serif' : '11px sans-serif';
    this.ctx.fillStyle = isPlayer ? '#b45309' : '#334155';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(name, x, y + 18);
  }
}
