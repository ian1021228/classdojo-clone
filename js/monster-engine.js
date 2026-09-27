/**
 * Crew Bee Engine - Authentic Vector Bee Avatar Generator
 * Sourced from high-quality open vector collections (Twemoji, Noto, OpenMoji, Fluent, FontAwesome).
 * Zero AI procedural artifacting; authentic, charming, scalable Honeybee characters!
 */

const HONEY_COLORS = [
  { name: '經典蜜糖金 (Honey Amber)', main: '#f59e0b', shadow: '#d97706', light: '#fef3c7', glow: 'rgba(245, 158, 11, 0.25)' },
  { name: '向日葵陽光 (Sunflower Gold)', main: '#eab308', shadow: '#ca8a04', light: '#fef9c3', glow: 'rgba(234, 179, 8, 0.25)' },
  { name: '百花青草綠 (Meadow Mint)', main: '#10b981', shadow: '#059669', light: '#d1fae5', glow: 'rgba(16, 185, 129, 0.25)' },
  { name: '晴空花園藍 (Sky Blossom)', main: '#0ea5e9', shadow: '#0284c7', light: '#e0f2fe', glow: 'rgba(14, 165, 233, 0.25)' },
  { name: '櫻花甜蜜粉 (Sakura Blossom)', main: '#ec4899', shadow: '#db2777', light: '#fce7f3', glow: 'rgba(236, 72, 153, 0.25)' },
  { name: '薰衣草淡紫 (Lavender Purple)', main: '#8b5cf6', shadow: '#7c3aed', light: '#ede9fe', glow: 'rgba(139, 92, 246, 0.25)' },
  { name: '甜橙蜜露橘 (Peach Coral)', main: '#f97316', shadow: '#ea580c', light: '#ffedd5', glow: 'rgba(249, 115, 22, 0.25)' },
  { name: '蜂王曜黑金 (Royal Velvet)', main: '#334155', shadow: '#1e293b', light: '#f1f5f9', glow: 'rgba(51, 65, 85, 0.25)' }
];

const BEE_ARCHETYPES = ['round', 'pear', 'tall', 'blob', 'fluffy'];
const EYE_STYLES = ['two_big', 'cyclops', 'three_eyes', 'sleepy', 'happy'];
const MOUTH_STYLES = ['smile', 'grin_teeth', 'tongue', 'cute_open', 'vampire'];
const ACCESSORY_STYLES = ['none', 'horns', 'antenna', 'ears', 'party_hat', 'glasses', 'bow'];

class BeeEngine {
  constructor() {
    this.colors = HONEY_COLORS;
    this.bodyShapes = BEE_ARCHETYPES;
    this.eyeStyles = EYE_STYLES;
    this.mouthStyles = MOUTH_STYLES;
    this.accessories = ACCESSORY_STYLES;
  }

  // Get deterministic traits based on student name hash
  getDeterministicTraits(name = 'Crew Bee') {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    const colorIdx = absHash % this.colors.length;
    const bodyIdx = (absHash >> 2) % this.bodyShapes.length;
    const eyeIdx = (absHash >> 4) % this.eyeStyles.length;
    const mouthIdx = (absHash >> 6) % this.mouthStyles.length;
    const accIdx = (absHash >> 8) % this.accessories.length;
    const isEgg = (absHash % 10) > 8;

    return {
      colorIdx,
      color: this.colors[colorIdx],
      bodyShape: this.bodyShapes[bodyIdx],
      eyeStyle: this.eyeStyles[eyeIdx],
      mouthStyle: this.mouthStyles[mouthIdx],
      accessory: this.accessories[accIdx],
      isHatched: !isEgg
    };
  }

  // Map archetype to authentic vector SVG file
  getBeeSvgPath(bodyShape) {
    switch (bodyShape) {
      case 'round':
        return 'assets/svg/bee-noto.svg';
      case 'pear':
        return 'assets/svg/bee-twemoji.svg';
      case 'tall':
        return 'assets/svg/bee-streamline.svg';
      case 'blob':
        return 'assets/svg/bee-openmoji.svg';
      case 'fluffy':
        return 'assets/svg/bee-emojione.svg';
      default:
        return 'assets/svg/bee-twemoji.svg';
    }
  }

  // Map accessory to authentic vector SVG overlay
  getAccessoryOverlay(accessory) {
    if (!accessory || accessory === 'none') return '';

    if (accessory === 'horns') {
      // Queen Crown
      return `
        <div style="position: absolute; top: -6px; left: 50%; transform: translateX(-50%); width: 34px; height: 34px; pointer-events: none; z-index: 4; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
          <img src="assets/svg/crown.svg" alt="皇冠" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
      `;
    } else if (accessory === 'antenna') {
      // Honey Pot
      return `
        <div style="position: absolute; bottom: 0px; right: -2px; width: 32px; height: 32px; pointer-events: none; z-index: 4; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
          <img src="assets/svg/honey-pot.svg" alt="蜜糖罐" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
      `;
    } else if (accessory === 'party_hat') {
      // Cherry Blossom Flower
      return `
        <div style="position: absolute; top: -4px; right: 8px; width: 30px; height: 30px; pointer-events: none; z-index: 4; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
          <img src="assets/svg/blossom.svg" alt="甜美櫻花" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
      `;
    } else if (accessory === 'bow') {
      // Sunflower
      return `
        <div style="position: absolute; top: 0px; left: 4px; width: 30px; height: 30px; pointer-events: none; z-index: 4; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
          <img src="assets/svg/sunflower.svg" alt="向日葵" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
      `;
    } else if (accessory === 'ears') {
      // Golden Sparkles
      return `
        <div style="position: absolute; top: -2px; right: -2px; width: 28px; height: 28px; pointer-events: none; z-index: 4;">
          <img src="assets/svg/sparkles.svg" alt="光芒" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
      `;
    } else if (accessory === 'glasses') {
      // Aviator flight goggles
      return `
        <div style="position: absolute; top: 30%; left: 50%; transform: translate(-50%, -50%); font-size: 1.5rem; pointer-events: none; z-index: 4; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));">
          🥽
        </div>
      `;
    }
    return '';
  }

  // Render Hatched Little Bee Avatar
  render(traits, size = 110) {
    if (!traits) traits = this.colors[0];
    if (typeof traits === 'string') {
      traits = this.getDeterministicTraits(traits);
    }

    const color = traits.color || this.colors[traits.colorIdx || 0] || this.colors[0];
    const body = traits.bodyShape || 'pear';
    const acc = traits.accessory || 'none';
    const svgPath = this.getBeeSvgPath(body);
    const accOverlay = this.getAccessoryOverlay(acc);

    return `
      <div class="crew-bee-avatar-wrap" style="position: relative; width: ${size}px; height: ${size}px; display: inline-flex; align-items: center; justify-content: center;">
        <!-- Honeycomb Aura Glow Background -->
        <div style="position: absolute; width: 88%; height: 88%; border-radius: 50%; background: ${color.light}; opacity: 0.85; filter: blur(2px); z-index: 1;"></div>
        
        <!-- Hexagon Decorative Cell Outline -->
        <div style="position: absolute; width: 92%; height: 92%; border-radius: 24%; border: 2px dashed ${color.shadow}; opacity: 0.35; z-index: 2;"></div>

        <!-- Authentic Honeybee SVG -->
        <div class="crew-bee-bobbing" style="position: relative; width: 78%; height: 78%; display: flex; align-items: center; justify-content: center; z-index: 3;">
          <img src="${svgPath}" alt="Crew Bee" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 8px ${color.glow});">
        </div>

        <!-- Accessory Layer -->
        ${accOverlay}
      </div>
    `;
  }

  // Render Unhatched Golden Bee Cocoon / Egg
  renderEgg(seed = 'egg', size = 110) {
    return `
      <div class="crew-bee-egg-wrap" style="position: relative; width: ${size}px; height: ${size}px; display: inline-flex; align-items: center; justify-content: center;" title="小蜂繭 ‧ 點擊即可破繭換裝！">
        <!-- Glowing Warm Honey Backdrop -->
        <div style="position: absolute; width: 85%; height: 85%; border-radius: 50%; background: radial-gradient(circle, #fef3c7 30%, #fde68a 80%); box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25); z-index: 1;"></div>

        <!-- Hexagon Honey Cell Border -->
        <div style="position: absolute; width: 90%; height: 90%; border-radius: 28%; border: 2px solid #f59e0b; opacity: 0.6; z-index: 2;"></div>

        <!-- Honeycomb Cocoon Visual -->
        <div class="crew-egg-pulse" style="position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;">
            <img src="assets/svg/honey-pot.svg" alt="蜜糖蜂繭" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 3px 6px rgba(180, 83, 9, 0.2));">
          </div>
          <span style="font-size: 0.72rem; font-weight: 800; color: #b45309; background: #ffffff; padding: 2px 8px; border-radius: 9999px; margin-top: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #fde68a;">
            🌱 待孵化
          </span>
        </div>
      </div>
    `;
  }

  // Render Whole Class Icon: Lively Beehive with Worker Bees & Honey Pot
  renderWholeClassIcon(size = 110) {
    return `
      <div class="crew-whole-class-wrap" style="position: relative; width: ${size}px; height: ${size}px; display: inline-flex; align-items: center; justify-content: center;">
        <!-- Hive Background Aura -->
        <div style="position: absolute; width: 90%; height: 90%; border-radius: 50%; background: radial-gradient(circle, #fef9c3 40%, #fef08a 90%); box-shadow: 0 4px 16px rgba(234, 179, 8, 0.3); z-index: 1;"></div>

        <!-- Center Giant Honey Pot -->
        <div style="position: absolute; width: 50%; height: 50%; z-index: 2; display: flex; align-items: center; justify-content: center;">
          <img src="assets/svg/honey-pot.svg" alt="全班蜂巢蜜糖" style="width: 100%; height: 100%; object-fit: contain;">
        </div>

        <!-- Left Mini Flying Bee -->
        <div style="position: absolute; top: 8%; left: 6%; width: 34%; height: 34%; z-index: 3; transform: rotate(-15deg);">
          <img src="assets/svg/bee-twemoji.svg" alt="小蜜蜂" style="width: 100%; height: 100%; object-fit: contain;">
        </div>

        <!-- Right Mini Flying Bee -->
        <div style="position: absolute; top: 12%; right: 6%; width: 32%; height: 32%; z-index: 3; transform: rotate(15deg) scaleX(-1);">
          <img src="assets/svg/bee-noto.svg" alt="小蜜蜂" style="width: 100%; height: 100%; object-fit: contain;">
        </div>

        <!-- Golden Sparkles -->
        <div style="position: absolute; bottom: 4%; left: 12%; width: 22%; height: 22%; z-index: 4;">
          <img src="assets/svg/sparkles.svg" alt="光芒" style="width: 100%; height: 100%; object-fit: contain;">
        </div>
      </div>
    `;
  }
}

function getBeeLevelInfo(points = 0) {
  const pts = Math.max(0, points || 0);
  if (pts >= 50) {
    return {
      level: 4,
      title: '👑 傳奇蜂巢守護者',
      badge: '👑',
      min: 50,
      next: null,
      progress: 100,
      nextDiff: 0,
      nextTitle: null
    };
  } else if (pts >= 30) {
    return {
      level: 3,
      title: '🥇 金蜜釀造大師',
      badge: '🥇',
      min: 30,
      next: 50,
      progress: Math.min(100, Math.round(((pts - 30) / 20) * 100)),
      nextDiff: 50 - pts,
      nextTitle: '👑 傳奇蜂巢守護者'
    };
  } else if (pts >= 15) {
    return {
      level: 2,
      title: '🥈 花園巡邏小隊長',
      badge: '🥈',
      min: 15,
      next: 30,
      progress: Math.min(100, Math.round(((pts - 15) / 15) * 100)),
      nextDiff: 30 - pts,
      nextTitle: '🥇 金蜜釀造大師'
    };
  } else {
    return {
      level: 1,
      title: '🥉 採蜜見習小蜂',
      badge: '🥉',
      min: 0,
      next: 15,
      progress: Math.min(100, Math.round((pts / 15) * 100)),
      nextDiff: 15 - pts,
      nextTitle: '🥈 花園巡邏小隊長'
    };
  }
}

const beeEngineInstance = new BeeEngine();
if (typeof window !== 'undefined') {
  window.HONEY_COLORS = HONEY_COLORS;
  window.BEE_ARCHETYPES = BEE_ARCHETYPES;
  window.BeeEngine = BeeEngine;
  window.MonsterEngine = BeeEngine;
  window.beeEngine = beeEngineInstance;
  window.monsterEngine = beeEngineInstance;
  window.getBeeLevelInfo = getBeeLevelInfo;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HONEY_COLORS, BEE_ARCHETYPES, BeeEngine, MonsterEngine: BeeEngine, getBeeLevelInfo };
}

