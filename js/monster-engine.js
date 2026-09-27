/**
 * ClassDojo Monster & Avatar Generator (Pure Vector SVG Engine)
 * Renders authentic, high-quality, scalable Dojo Monsters & Eggs.
 */

const MONSTER_COLORS = [
  { name: 'Dojo Green', main: '#00d27a', shadow: '#00a35c', belly: '#a3f3cc' },
  { name: 'Ocean Blue', main: '#3a86ff', shadow: '#1d63d8', belly: '#badaff' },
  { name: 'Berry Purple', main: '#8338ec', shadow: '#6116be', belly: '#d6b8ff' },
  { name: 'Warm Orange', main: '#fb5607', shadow: '#cf3e00', belly: '#fed0bb' },
  { name: 'Sunny Yellow', main: '#ffbe0b', shadow: '#d49b00', belly: '#fff1c5' },
  { name: 'Bright Pink', main: '#ff006e', shadow: '#c40054', belly: '#ffb3d5' },
  { name: 'Teal Mint', main: '#06d6a0', shadow: '#039b73', belly: '#baf7e5' },
  { name: 'Coral Red', main: '#ff4d6d', shadow: '#c9184a', belly: '#ffccd5' }
];

const BODY_SHAPES = ['round', 'pear', 'tall', 'blob', 'fluffy'];
const EYE_STYLES = ['two_big', 'cyclops', 'three_eyes', 'sleepy', 'happy'];
const MOUTH_STYLES = ['smile', 'grin_teeth', 'tongue', 'cute_open', 'vampire'];
const ACCESSORY_STYLES = ['none', 'horns', 'antenna', 'ears', 'party_hat', 'glasses', 'bow'];

class MonsterEngine {
  constructor() {
    this.colors = MONSTER_COLORS;
    this.bodyShapes = BODY_SHAPES;
    this.eyeStyles = EYE_STYLES;
    this.mouthStyles = MOUTH_STYLES;
    this.accessories = ACCESSORY_STYLES;
  }

  // Generate deterministic pseudo-random traits from string name
  getDeterministicTraits(name) {
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
    const isEgg = (absHash % 10) > 8; // small chance or based on hatched state

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

  // Render SVG string
  render(traits, size = 120) {
    if (!traits) traits = this.colors[0];
    if (typeof traits === 'string') {
      traits = this.getDeterministicTraits(traits);
    }

    const color = traits.color || this.colors[traits.colorIdx || 0] || this.colors[0];
    const body = traits.bodyShape || 'round';
    const eyes = traits.eyeStyle || 'two_big';
    const mouth = traits.mouthStyle || 'smile';
    const acc = traits.accessory || 'none';

    let bodySvg = '';
    let feetSvg = `
      <ellipse cx="44" cy="88" rx="8" ry="5" fill="${color.shadow}" />
      <ellipse cx="76" cy="88" rx="8" ry="5" fill="${color.shadow}" />
    `;

    // Render Body according to shape
    if (body === 'round') {
      bodySvg = `
        <circle cx="60" cy="56" r="34" fill="${color.main}" />
        <ellipse cx="60" cy="62" rx="20" ry="16" fill="${color.belly}" opacity="0.65" />
      `;
    } else if (body === 'pear') {
      bodySvg = `
        <path d="M 40,32 C 40,20 80,20 80,32 C 80,48 94,62 94,72 C 94,86 78,92 60,92 C 42,92 26,86 26,72 C 26,62 40,48 40,32 Z" fill="${color.main}" />
        <ellipse cx="60" cy="66" rx="22" ry="18" fill="${color.belly}" opacity="0.65" />
      `;
    } else if (body === 'tall') {
      bodySvg = `
        <rect x="34" y="24" width="52" height="66" rx="26" fill="${color.main}" />
        <ellipse cx="60" cy="64" rx="16" ry="20" fill="${color.belly}" opacity="0.65" />
      `;
    } else if (body === 'blob') {
      bodySvg = `
        <path d="M 60 22 C 82 22 96 36 94 58 C 92 80 84 90 60 90 C 36 90 28 80 26 58 C 24 36 38 22 60 22 Z" fill="${color.main}" />
        <ellipse cx="60" cy="65" rx="24" ry="17" fill="${color.belly}" opacity="0.65" />
      `;
    } else { // fluffy
      bodySvg = `
        <path d="M 60 22 C 72 16 88 26 88 40 C 98 48 98 68 88 78 C 84 88 68 92 60 88 C 52 92 36 88 32 78 C 22 68 22 48 32 40 C 32 26 48 16 60 22 Z" fill="${color.main}" />
        <circle cx="60" cy="60" r="20" fill="${color.belly}" opacity="0.65" />
      `;
    }

    // Render Accessories
    let accSvg = '';
    if (acc === 'horns') {
      accSvg = `
        <path d="M 38 30 Q 30 14 36 10 Q 45 18 43 28 Z" fill="#ffd166" stroke="${color.shadow}" stroke-width="1.5" />
        <path d="M 82 30 Q 90 14 84 10 Q 75 18 77 28 Z" fill="#ffd166" stroke="${color.shadow}" stroke-width="1.5" />
      `;
    } else if (acc === 'antenna') {
      accSvg = `
        <path d="M 60 25 Q 52 10 58 6" stroke="${color.shadow}" stroke-width="3" stroke-linecap="round" fill="none" />
        <circle cx="58" cy="6" r="6" fill="#ffd166" stroke="${color.shadow}" stroke-width="1.5" />
      `;
    } else if (acc === 'ears') {
      accSvg = `
        <ellipse cx="32" cy="30" rx="6" ry="14" fill="${color.main}" stroke="${color.shadow}" stroke-width="1.5" transform="rotate(-25 32 30)" />
        <ellipse cx="32" cy="30" rx="3" ry="9" fill="${color.belly}" transform="rotate(-25 32 30)" />
        <ellipse cx="88" cy="30" rx="6" ry="14" fill="${color.main}" stroke="${color.shadow}" stroke-width="1.5" transform="rotate(25 88 30)" />
        <ellipse cx="88" cy="30" rx="3" ry="9" fill="${color.belly}" transform="rotate(25 88 30)" />
      `;
    } else if (acc === 'party_hat') {
      accSvg = `
        <polygon points="60,6 48,28 72,28" fill="#ff4d6d" stroke="#fff" stroke-width="1" />
        <circle cx="60" cy="6" r="3.5" fill="#ffd166" />
        <line x1="51" y1="20" x2="69" y2="20" stroke="#ffd166" stroke-width="2" />
      `;
    } else if (acc === 'glasses') {
      accSvg = `
        <circle cx="48" cy="48" r="11" fill="none" stroke="#2b3b48" stroke-width="2.5" />
        <circle cx="72" cy="48" r="11" fill="none" stroke="#2b3b48" stroke-width="2.5" />
        <line x1="59" y1="48" x2="61" y2="48" stroke="#2b3b48" stroke-width="2.5" />
      `;
    } else if (acc === 'bow') {
      accSvg = `
        <path d="M 72 26 L 82 20 L 82 32 Z" fill="#ff4d6d" />
        <path d="M 72 26 L 62 20 L 62 32 Z" fill="#ff4d6d" />
        <circle cx="72" cy="26" r="3" fill="#ffd166" />
      `;
    }

    // Render Eyes
    let eyesSvg = '';
    if (eyes === 'cyclops') {
      eyesSvg = `
        <circle cx="60" cy="44" r="12" fill="#ffffff" stroke="#e0e0e0" stroke-width="1" />
        <circle cx="60" cy="44" r="6" fill="#2b3b48" />
        <circle cx="62" cy="42" r="2.2" fill="#ffffff" />
      `;
    } else if (eyes === 'two_big') {
      eyesSvg = `
        <circle cx="49" cy="46" r="9" fill="#ffffff" />
        <circle cx="49" cy="46" r="4.5" fill="#2b3b48" />
        <circle cx="50.5" cy="44.5" r="1.8" fill="#ffffff" />

        <circle cx="71" cy="46" r="9" fill="#ffffff" />
        <circle cx="71" cy="46" r="4.5" fill="#2b3b48" />
        <circle cx="72.5" cy="44.5" r="1.8" fill="#ffffff" />
      `;
    } else if (eyes === 'three_eyes') {
      eyesSvg = `
        <circle cx="44" cy="48" r="6.5" fill="#ffffff" />
        <circle cx="44" cy="48" r="3.2" fill="#2b3b48" />
        <circle cx="45" cy="47" r="1.2" fill="#ffffff" />

        <circle cx="60" cy="42" r="7.5" fill="#ffffff" />
        <circle cx="60" cy="42" r="3.8" fill="#2b3b48" />
        <circle cx="61" cy="41" r="1.5" fill="#ffffff" />

        <circle cx="76" cy="48" r="6.5" fill="#ffffff" />
        <circle cx="76" cy="48" r="3.2" fill="#2b3b48" />
        <circle cx="77" cy="47" r="1.2" fill="#ffffff" />
      `;
    } else if (eyes === 'sleepy') {
      eyesSvg = `
        <path d="M 42 46 Q 49 42 56 46" stroke="#2b3b48" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 64 46 Q 71 42 78 46" stroke="#2b3b48" stroke-width="3" stroke-linecap="round" fill="none" />
      `;
    } else { // happy
      eyesSvg = `
        <path d="M 42 46 Q 49 50 56 46" stroke="#2b3b48" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 64 46 Q 71 50 78 46" stroke="#2b3b48" stroke-width="3" stroke-linecap="round" fill="none" />
      `;
    }

    // Render Mouth
    let mouthSvg = '';
    if (mouth === 'smile') {
      mouthSvg = `
        <path d="M 50 62 Q 60 72 70 62" stroke="#2b3b48" stroke-width="2.8" stroke-linecap="round" fill="none" />
      `;
    } else if (mouth === 'grin_teeth') {
      mouthSvg = `
        <path d="M 48 60 Q 60 74 72 60 Z" fill="#2b3b48" />
        <path d="M 52 61 L 68 61 L 65 65 L 55 65 Z" fill="#ffffff" />
      `;
    } else if (mouth === 'tongue') {
      mouthSvg = `
        <path d="M 50 61 Q 60 73 70 61 Z" fill="#2b3b48" />
        <path d="M 56 65 Q 60 74 64 65 Z" fill="#ff4d6d" />
      `;
    } else if (mouth === 'cute_open') {
      mouthSvg = `
        <ellipse cx="60" cy="64" rx="5" ry="6" fill="#2b3b48" />
        <ellipse cx="60" cy="65" rx="3.5" ry="3.5" fill="#ff4d6d" />
      `;
    } else { // vampire
      mouthSvg = `
        <path d="M 49 61 Q 60 71 71 61" stroke="#2b3b48" stroke-width="2.5" fill="none" />
        <polygon points="53,62 55,67 57,62" fill="#fff" />
        <polygon points="63,62 65,67 67,62" fill="#fff" />
      `;
    }

    return `
      <svg class="dojo-monster-svg" viewBox="0 0 120 100" width="${size}" height="${(size * 100) / 120}" xmlns="http://www.w3.org/2000/svg">
        <g class="dojo-monster-group">
          ${feetSvg}
          ${acc === 'horns' || acc === 'antenna' || acc === 'ears' || acc === 'party_hat' ? accSvg : ''}
          ${bodySvg}
          ${acc === 'glasses' || acc === 'bow' ? accSvg : ''}
          ${eyesSvg}
          ${mouthSvg}
        </g>
      </svg>
    `;
  }

  // Render authentic ClassDojo Monster Egg
  renderEgg(seed = 'egg', size = 120) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const patternType = absHash % 4; // 0: stripes, 1: spots, 2: zigzags, 3: bubbles

    const bgGradId = `egg-grad-${absHash}`;
    let patternSvg = '';

    if (patternType === 0) {
      // Gentle waves
      patternSvg = `
        <path d="M 28 42 Q 60 34 92 42 Q 60 50 28 42 Z" fill="#90a0d9" opacity="0.6" />
        <path d="M 26 58 Q 60 50 94 58 Q 60 66 26 58 Z" fill="#90a0d9" opacity="0.6" />
        <path d="M 32 74 Q 60 66 88 74 Q 60 82 32 74 Z" fill="#90a0d9" opacity="0.6" />
      `;
    } else if (patternType === 1) {
      // Spots / hexagons
      patternSvg = `
        <polygon points="42,38 48,34 54,38 54,46 48,50 42,46" fill="#90a0d9" opacity="0.7" />
        <polygon points="68,44 74,40 80,44 80,52 74,56 68,52" fill="#90a0d9" opacity="0.7" />
        <polygon points="50,60 56,56 62,60 62,68 56,72 50,68" fill="#90a0d9" opacity="0.7" />
        <polygon points="34,64 38,61 42,64 42,70 38,73 34,70" fill="#90a0d9" opacity="0.7" />
      `;
    } else if (patternType === 2) {
      // Zigzag band
      patternSvg = `
        <path d="M 28 50 L 38 44 L 48 50 L 58 44 L 68 50 L 78 44 L 88 50 L 88 56 L 78 50 L 68 56 L 58 50 L 48 56 L 38 50 L 28 56 Z" fill="#90a0d9" opacity="0.7" />
        <circle cx="58" cy="34" r="5" fill="#90a0d9" opacity="0.6" />
        <circle cx="44" cy="68" r="6" fill="#90a0d9" opacity="0.6" />
        <circle cx="72" cy="68" r="5" fill="#90a0d9" opacity="0.6" />
      `;
    } else {
      // Bubbles
      patternSvg = `
        <ellipse cx="44" cy="40" rx="7" ry="9" fill="#90a0d9" opacity="0.6" />
        <ellipse cx="70" cy="46" rx="8" ry="11" fill="#90a0d9" opacity="0.6" />
        <ellipse cx="48" cy="64" rx="10" ry="8" fill="#90a0d9" opacity="0.6" />
        <ellipse cx="76" cy="68" rx="6" ry="6" fill="#90a0d9" opacity="0.6" />
      `;
    }

    return `
      <svg class="dojo-egg-svg" viewBox="0 0 120 100" width="${size}" height="${(size * 100) / 120}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${bgGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="40%" stop-color="#eaefff" />
            <stop offset="100%" stop-color="#bcc7ec" />
          </linearGradient>
          <clipPath id="egg-clip-${absHash}">
            <path d="M 60 14 C 78 14 96 46 96 66 C 96 82 80 92 60 92 C 40 92 24 82 24 66 C 24 46 42 14 60 14 Z" />
          </clipPath>
        </defs>
        <g>
          <!-- Shadow -->
          <ellipse cx="60" cy="93" rx="30" ry="5" fill="#2b3b48" opacity="0.15" />
          <!-- Egg Body -->
          <path d="M 60 14 C 78 14 96 46 96 66 C 96 82 80 92 60 92 C 40 92 24 82 24 66 C 24 46 42 14 60 14 Z" fill="url(#${bgGradId})" stroke="#a3b2e0" stroke-width="1.5" />
          <!-- Patterns clipped to egg -->
          <g clip-path="url(#egg-clip-${absHash})">
            ${patternSvg}
            <!-- Egg shine highlight -->
            <path d="M 36 28 Q 42 22 52 20" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none" opacity="0.8" />
          </g>
        </g>
      </svg>
    `;
  }

  // Render Whole Class Icon (Cluster of mini monsters)
  renderWholeClassIcon(size = 120) {
    return `
      <svg class="dojo-whole-class-svg" viewBox="0 0 120 100" width="${size}" height="${(size * 100) / 120}" xmlns="http://www.w3.org/2000/svg">
        <g>
          <!-- Bottom Shadow -->
          <ellipse cx="60" cy="90" rx="42" ry="7" fill="#2b3b48" opacity="0.12" />

          <!-- Left Mini Blue Monster -->
          <g transform="translate(14, 28) scale(0.65)">
            <circle cx="36" cy="46" r="28" fill="#3a86ff" />
            <circle cx="28" cy="40" r="7" fill="#fff" />
            <circle cx="29" cy="40" r="3.5" fill="#2b3b48" />
            <circle cx="44" cy="40" r="7" fill="#fff" />
            <circle cx="45" cy="40" r="3.5" fill="#2b3b48" />
            <path d="M 30 54 Q 36 62 42 54" stroke="#2b3b48" stroke-width="2.5" fill="none" stroke-linecap="round" />
          </g>

          <!-- Right Mini Pink Monster -->
          <g transform="translate(54, 28) scale(0.65)">
            <circle cx="36" cy="46" r="28" fill="#ff006e" />
            <path d="M 20 26 Q 16 10 24 16 Z" fill="#ffd166" />
            <path d="M 52 26 Q 56 10 48 16 Z" fill="#ffd166" />
            <circle cx="28" cy="40" r="7" fill="#fff" />
            <circle cx="29" cy="40" r="3.5" fill="#2b3b48" />
            <circle cx="44" cy="40" r="7" fill="#fff" />
            <circle cx="45" cy="40" r="3.5" fill="#2b3b48" />
            <path d="M 30 54 Q 36 62 42 54" stroke="#2b3b48" stroke-width="2.5" fill="none" stroke-linecap="round" />
          </g>

          <!-- Center Front Mojo Monster (Iconic Green) -->
          <g transform="translate(24, 20) scale(0.8)">
            <!-- Antenna -->
            <path d="M 45 16 Q 42 6 45 4" stroke="#00a35c" stroke-width="3" stroke-linecap="round" fill="none" />
            <circle cx="45" cy="4" r="5" fill="#ffd166" />
            <!-- Body -->
            <circle cx="45" cy="46" r="32" fill="#00d27a" />
            <ellipse cx="45" cy="56" rx="20" ry="14" fill="#a3f3cc" opacity="0.75" />
            <!-- Big Cute Eyes -->
            <circle cx="34" cy="38" r="9.5" fill="#ffffff" />
            <circle cx="35" cy="38" r="4.8" fill="#2b3b48" />
            <circle cx="36" cy="36" r="1.8" fill="#ffffff" />

            <circle cx="56" cy="38" r="9.5" fill="#ffffff" />
            <circle cx="57" cy="38" r="4.8" fill="#2b3b48" />
            <circle cx="58" cy="36" r="1.8" fill="#ffffff" />

            <!-- Happy Smile -->
            <path d="M 37 54 Q 45 66 53 54" stroke="#2b3b48" stroke-width="3" stroke-linecap="round" fill="none" />
          </g>
        </g>
      </svg>
    `;
  }
}

window.monsterEngine = new MonsterEngine();
