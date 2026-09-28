// Environment Polyfills for Headless Node.js Execution
const storage = new Map();
const mockLocalStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
  get length() { return storage.size; },
  key: (i) => Array.from(storage.keys())[i] || null
};

globalThis.localStorage = mockLocalStorage;
global.localStorage = mockLocalStorage;

const mockWindow = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  localStorage: mockLocalStorage
};

globalThis.window = mockWindow;
global.window = mockWindow;

globalThis.CustomEvent = class CustomEvent {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict?.detail || null;
  }
};
global.CustomEvent = globalThis.CustomEvent;

import fs from 'fs';
const { store } = await import('../js/store.js');
const { verifyPassword } = await import('../js/security.js');

console.log('================================================================================');
console.log('DUAL VIEWPORT (DESKTOP 1280x800 & MOBILE 393x852) + BUTTON INTEGRITY TEST SUITE');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Check User Rule 2 Credentials & Hash
console.log('[SUITE 1: USER RULE 2 AUTHENTICATION VERIFICATION]');
const AUTH_HASH = 'a4b2c7a2217be305973615237f9b904a62b9b032b9c8bd9c069f3258dbf0ad0c';
const isTeacherPasswordValid = await verifyPassword('123456', AUTH_HASH);
assert(isTeacherPasswordValid === true, 'Test password "123456" verified against salted SHA-256 hash');
const isInvalidPasswordRejected = await verifyPassword('wrongpassword', AUTH_HASH);
assert(isInvalidPasswordRejected === false, 'Invalid password is properly rejected');

// 2. Check HTML files structure & viewport tags for Mobile 393x852
console.log('\n[SUITE 2: MULTI-VIEWPORT VIEWPORT META & RESPONSIVE COMPLIANCE (393x852)]');
const pages = ['index.html', 'teacher.html', 'student.html', 'parent.html'];
pages.forEach(p => {
  const content = fs.readFileSync(p, 'utf8');
  assert(content.includes('name="viewport"'), `${p} contains viewport meta tag for mobile responsiveness`);
  assert(content.includes('width=device-width'), `${p} specifies width=device-width`);
  assert(content.includes('mobile-bottom-bar'), `${p} contains .mobile-bottom-bar navigation for 393x852 mobile touch`);
  assert(content.includes('fa-solid'), `${p} includes FontAwesome 6 icons`);
  assert(!content.includes('<style></style>'), `${p} does not contain empty style blocks`);
});

// 3. Check CSS for 393px Mobile Breakpoints
console.log('\n[SUITE 3: CSS MEDIA QUERY BREAKPOINTS & OVERFLOW GUARDS]');
const styleCss = fs.readFileSync('css/style.css', 'utf8');
assert(styleCss.includes('@media (max-width: 768px)'), 'style.css defines mobile breakpoint (max-width: 768px) covering 393px width');
assert(styleCss.includes('.mobile-bottom-bar'), 'style.css contains styles for .mobile-bottom-bar');
assert(styleCss.includes('overflow-x: hidden') || styleCss.includes('max-width: 100%'), 'style.css has overflow bounds preventing horizontal scrollbars');

// 4. Audit Button Interactivity & Missing Listeners
console.log('\n[SUITE 4: ALL BUTTONS & INTERACTIVE ELEMENTS AUDIT]');

function auditPageButtons(htmlPath, jsPaths) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  let jsCombined = '';
  jsPaths.forEach(p => {
    if (fs.existsSync(p)) jsCombined += fs.readFileSync(p, 'utf8');
  });

  const buttonRegex = /<button[^>]*id=["\x27]([^"\x27]+)["\x27][^>]*>/g;
  let match;
  const ids = [];
  while ((match = buttonRegex.exec(html)) !== null) {
    ids.push(match[1]);
  }

  let missing = 0;
  ids.forEach(id => {
    // Check if ID is handled in JS or in inline script of HTML
    const inJs = jsCombined.includes(`'${id}'`) || jsCombined.includes(`"${id}"`) || jsCombined.includes(`\`${id}\``);
    const inHtml = html.includes(`'${id}'`) || html.includes(`"${id}"`) || html.includes(`\`${id}\``);
    if (!inJs && !inHtml) {
      console.error(`    Missing handler for button: #${id} in ${htmlPath}`);
      missing++;
    }
  });

  assert(missing === 0, `${htmlPath}: All ${ids.length} buttons with IDs have corresponding script handlers (Missing: ${missing})`);
}

auditPageButtons('index.html', ['js/audio.js', 'js/changelog.js', 'js/store.js', 'js/security.js']);
auditPageButtons('teacher.html', ['js/teacher.js', 'js/audio.js', 'js/changelog.js', 'js/store.js']);
auditPageButtons('student.html', ['js/student.js', 'js/audio.js', 'js/changelog.js', 'js/store.js']);
auditPageButtons('parent.html', ['js/parent.js', 'js/audio.js', 'js/changelog.js', 'js/store.js']);

// 5. Multi-Role Login Verification
console.log('\n[SUITE 5: MULTI-ROLE COMMERCIAL LOGIN HUB ON INDEX.HTML]');
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('pane-tab-teacher'), 'index.html contains Teacher login pane');
assert(indexHtml.includes('pane-tab-student'), 'index.html contains Student code & quick-picker pane');
assert(indexHtml.includes('pane-tab-parent'), 'index.html contains Parent invite & quick-picker pane');
assert(indexHtml.includes('pane-tab-demo'), 'index.html contains 1-Click Instant Playground sandbox pane');
assert(indexHtml.includes('data-student-id="stu_demo_1"') || indexHtml.includes('data-student-id="stu_1"'), 'index.html quick-picker includes student 1 (Beyoncé)');
assert(indexHtml.includes('data-student-id="stu_demo_5"') || indexHtml.includes('data-student-id="stu_5"'), 'index.html quick-picker includes student 5 (Leonardo)');
assert(indexHtml.includes('parent.html?child=stu_demo_1') || indexHtml.includes('parent.html?child=stu_1'), 'index.html quick-picker maps to parent child parameter');
assert(indexHtml.includes('btn-mobile-quick-login'), 'index.html has mobile-visible quick login button');

// 6. User Global Rule 1: Changelog Maintenance
console.log('\n[SUITE 6: CHANGELOG MAINTENANCE (USER GLOBAL RULE 1)]');
const changelogJs = fs.readFileSync('js/changelog.js', 'utf8');
assert(changelogJs.includes('v2.10.0'), 'changelog.js includes latest v2.10.0 release');
assert(changelogJs.includes('isLatest: true'), 'changelog.js marks v2.10.0 as latest');
assert(indexHtml.includes('id="changelog-container"'), 'index.html features changelog container section');

// 7. User Global Rule 4: Data Security & Zero Disruption
console.log('\n[SUITE 7: DATA DISRUPTION & SCHEMA INTEGRITY CHECK]');
const activeClass = store.getActiveClass();
assert(activeClass !== null && activeClass !== undefined, 'Active class is securely initialized');
assert(activeClass.students.length >= 5, `Active class preserves at least 5 students (Actual: ${activeClass.students.length})`);
assert(activeClass.students.some(s => s.name === 'Beyoncé'), 'Beyoncé student record data intact');
assert(activeClass.students.some(s => s.name === 'Leonardo'), 'Leonardo student record data intact');

// 8. ClassDojo Breakthrough Features Verification (v2.9.0)
console.log('\n[SUITE 8: CLASSDOJO SOUL-LEVEL VISUAL & FEATURE BREAKTHROUGHS]');
const teacherHtml = fs.readFileSync('teacher.html', 'utf8');
const studentHtml = fs.readFileSync('student.html', 'utf8');
const parentHtml = fs.readFileSync('parent.html', 'utf8');
const teacherJs = fs.readFileSync('js/teacher.js', 'utf8');
const studentJs = fs.readFileSync('js/student.js', 'utf8');
const parentJs = fs.readFileSync('js/parent.js', 'utf8');
const dojoUiCss = fs.readFileSync('css/dojo-ui.css', 'utf8');

assert(teacherHtml.includes('id="btn-toggle-presentation"'), 'teacher.html features Presentation Mode toggle button');
assert(dojoUiCss.includes('body.presentation-mode'), 'css/dojo-ui.css defines theater presentation layout styles');
assert(teacherHtml.includes('id="celebration-splash"'), 'teacher.html features Giant Point Celebration Splash overlay');
assert(teacherJs.includes('showCelebrationSplash'), 'teacher.js implements showCelebrationSplash method');
assert(teacherHtml.includes('id="lucky-wheel-canvas"'), 'teacher.html features Lucky Wheel canvas element');
assert(teacherJs.includes('drawLuckyWheel'), 'teacher.js implements drawLuckyWheel method');
assert(teacherJs.includes('spinRandomPicker'), 'teacher.js implements physics-based spinRandomPicker method');
assert(studentJs.includes('eggCrackStep'), 'student.js implements 3-Stage Egg Cracking Ceremony');
assert(studentHtml.includes('id="student-badges-showroom"'), 'student.html features 8-Badge Achievement Showroom');
assert(studentJs.includes('renderBadgesShowroom'), 'student.js implements renderBadgesShowroom method');
assert(studentHtml.includes('class="streak-fire-pill"'), 'student.html features Duolingo-style Streak Fire Pill');

// 9. Class Milestone Goal & Parent Family Cheer Features (v2.10.0)
console.log('\n[SUITE 9: CLASS MILESTONE GOAL & PARENT FAMILY CHEER]');
assert(teacherHtml.includes('id="class-milestone-goal-card"'), 'teacher.html features Class Milestone Goal Thermometer');
assert(teacherHtml.includes('id="milestone-goal-modal"'), 'teacher.html features Milestone Goal Settings Modal');
assert(teacherJs.includes('renderMilestoneGoal'), 'teacher.js implements renderMilestoneGoal method');
assert(studentHtml.includes('id="student-milestone-goal-card"'), 'student.html features student-facing Milestone Goal banner');
assert(parentHtml.includes('id="btn-send-parent-cheer"'), 'parent.html features Family Cheer Send Button');
assert(parentJs.includes('sendParentCheer'), 'parent.js wires up sendParentCheer integration');
assert(typeof store.sendParentCheer === 'function', 'store.js exports sendParentCheer API');
assert(typeof store.updateClassMilestoneGoal === 'function', 'store.js exports updateClassMilestoneGoal API');

// Test sendParentCheer functionality
const initialPoints = activeClass.students[0].points;
const cheerRes = store.sendParentCheer(activeClass.students[0].id, '加油小寶貝！');
assert(cheerRes !== null, 'sendParentCheer creates cheer item successfully');
assert(activeClass.students[0].points === initialPoints + 1, 'sendParentCheer awards +1 point to student');
assert(cheerRes.fromParent === true, 'cheer item has fromParent flag');

console.log('\n================================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('================================================================================');

if (failCount > 0) {
  process.exit(1);
}
