/**
 * Empirical Stress Test Suite for js/store.js
 * Milestone M0 Challenger 1 Verification Harness
 * 
 * Verifies:
 * 1. Hive group points calculation when students are added, removed, or have negative points.
 * 2. Idempotent point awarding on multiple successive calls to approvePortfolioSubmission.
 * 3. Creation of multiple portfolio submissions with edge-case strings, unicode, and null values.
 */

// 1. Environment Polyfills for Headless Node.js Execution
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
  get length() { return storage.size; },
  key: (i) => Array.from(storage.keys())[i] || null
};

globalThis.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  localStorage: globalThis.localStorage
};

globalThis.CustomEvent = class CustomEvent {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict ? eventInitDict.detail : null;
  }
};

// 2. Import Store Module Under Test
const { store } = await import('../js/store.js');

// 3. Test Runner Harness
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    failures.push(message);
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  const isMatch = actual === expected;
  const detail = `(Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)})`;
  assert(isMatch, `${message} ${isMatch ? '' : detail}`);
}

console.log('='.repeat(80));
console.log('STARTING EMPIRICAL STRESS TEST SUITE FOR js/store.js');
console.log('='.repeat(80));

// ============================================================================
// SUITE 1: HIVE GROUP POINTS CALCULATION & LIFECYCLE STRESS TESTS
// ============================================================================
console.log('\n--- SUITE 1: HIVE GROUP POINTS CALCULATION & LIFECYCLE ---');

// Reset to known clean demo data state
store.resetDemoData();
const demoClass = store.getActiveClass();
const classId = demoClass.id;

// 1.1 Baseline Demo Groups Points Check
console.log('\n[1.1 Baseline Demo Groups Check]');
const grp1 = demoClass.groups.find(g => g.id === 'grp_demo_1');
const grp2 = demoClass.groups.find(g => g.id === 'grp_demo_2');
assert(grp1 !== undefined, 'Demo Group 1 exists');
assert(grp2 !== undefined, 'Demo Group 2 exists');

// stu_demo_1 (5) + stu_demo_2 (4) = 9
assertEqual(grp1.points, 9, 'Demo Group 1 initial points correctly equals 9 (5+4)');
// stu_demo_3 (3) + stu_demo_4 (3) + stu_demo_5 (3) = 9
assertEqual(grp2.points, 9, 'Demo Group 2 initial points correctly equals 9 (3+3+3)');

// 1.2 Creating New Hive Group and Adding Students
console.log('\n[1.2 Group Creation & Member Addition]');
const newGroup = store.createHiveGroup(classId, {
  name: '🐝 蜂王精銳組',
  studentIds: ['stu_demo_1'], // 5 points
  goalPoints: 50,
  icon: 'fa-solid fa-crown',
  color: '#eab308'
});

assert(newGroup !== null, 'Created new Hive Group successfully');
assertEqual(newGroup.points, 5, 'New group points equals initial member points (5)');

// Add stu_demo_2 (4 points) -> total should be 9
store.updateHiveGroup(classId, newGroup.id, {
  studentIds: ['stu_demo_1', 'stu_demo_2']
});
const updatedGroupAfterAdd = demoClass.groups.find(g => g.id === newGroup.id);
assertEqual(updatedGroupAfterAdd.points, 9, 'Group points correctly recalculated to 9 after adding student (5+4)');

// Add stu_demo_3 (3 points) -> total should be 12
store.updateHiveGroup(classId, newGroup.id, {
  studentIds: ['stu_demo_1', 'stu_demo_2', 'stu_demo_3']
});
assertEqual(updatedGroupAfterAdd.points, 12, 'Group points correctly recalculated to 12 after adding another student (5+4+3)');

// Deduplication test: Passing duplicate IDs in studentIds
store.updateHiveGroup(classId, newGroup.id, {
  studentIds: ['stu_demo_1', 'stu_demo_1', 'stu_demo_2', 'stu_demo_2', 'stu_demo_3']
});
assertEqual(updatedGroupAfterAdd.studentIds.length, 3, 'Duplicate studentIds were deduplicated by updateHiveGroup');
assertEqual(updatedGroupAfterAdd.points, 12, 'Group points unaffected by duplicate studentIds (12)');

// 1.3 Removing Students from Group
console.log('\n[1.3 Removing Students from Group]');
// Remove stu_demo_2 (4 points) -> remaining: stu_demo_1 (5) + stu_demo_3 (3) = 8
store.updateHiveGroup(classId, newGroup.id, {
  studentIds: ['stu_demo_1', 'stu_demo_3']
});
assertEqual(updatedGroupAfterAdd.points, 8, 'Group points correctly reduced to 8 after removing stu_demo_2');

// Remove all students -> group points should be 0
store.updateHiveGroup(classId, newGroup.id, {
  studentIds: []
});
assertEqual(updatedGroupAfterAdd.points, 0, 'Group points correctly becomes 0 when group has no members');
assertEqual(updatedGroupAfterAdd.studentIds.length, 0, 'Group has 0 studentIds');

// 1.4 Handling Negative Points
console.log('\n[1.4 Negative Points Handling]');
// Re-add stu_demo_1 (currently 5 pts) and stu_demo_2 (currently 4 pts)
store.updateHiveGroup(classId, newGroup.id, {
  studentIds: ['stu_demo_1', 'stu_demo_2']
});
assertEqual(updatedGroupAfterAdd.points, 9, 'Group points back to 9');

// Award negative points (-6) to stu_demo_1 -> student points: 5 - 6 = -1
store.awardStudentPoint(classId, 'stu_demo_1', {
  name: '💨 飛行分心',
  points: -6,
  icon: '💨'
});

const student1 = demoClass.students.find(s => s.id === 'stu_demo_1');
assertEqual(student1.points, -1, 'Student 1 has negative points (-1)');
assertEqual(updatedGroupAfterAdd.points, 3, 'Group points dynamically recalculated with negative member points: -1 + 4 = 3');

// Award more negative points to stu_demo_2 (-10) -> student 2 points: 4 - 10 = -6
store.awardStudentPoint(classId, 'stu_demo_2', {
  name: '🥀 忘帶工具',
  points: -10,
  icon: '🥀'
});
const student2 = demoClass.students.find(s => s.id === 'stu_demo_2');
assertEqual(student2.points, -6, 'Student 2 has negative points (-6)');
assertEqual(updatedGroupAfterAdd.points, -7, 'Group points dynamically reflects multiple negative students: -1 + (-6) = -7');

// 1.5 Direct Group Point Award with Negative Points
console.log('\n[1.5 awardHiveGroupPoint with Negative Points]');
const initialClassTotal = demoClass.totalPoints;
// Award -2 points to the group of 2 students
const awardResult = store.awardHiveGroupPoint(classId, newGroup.id, {
  name: '小組喧嘩',
  points: -2,
  icon: '⚠️'
});

assertEqual(awardResult.awardedCount, 2, 'awardHiveGroupPoint awarded to 2 students');
assertEqual(student1.points, -3, 'Student 1 points decreased by 2: -1 - 2 = -3');
assertEqual(student2.points, -8, 'Student 2 points decreased by 2: -6 - 2 = -8');
assertEqual(updatedGroupAfterAdd.points, -11, 'Group points recalculated after group penalty: -3 + (-8) = -11');
assertEqual(demoClass.totalPoints, initialClassTotal - 4, 'Class total points decreased by 4 (2 students * -2)');

// 1.6 calculateGroupPoints Direct Invariant & Boundary Testing
console.log('\n[1.6 calculateGroupPoints Boundary Invariants]');
assertEqual(store.calculateGroupPoints(null, ['stu_demo_1']), 0, 'calculateGroupPoints handles null class gracefully');
assertEqual(store.calculateGroupPoints(demoClass, null), 0, 'calculateGroupPoints handles null studentIds gracefully');
assertEqual(store.calculateGroupPoints(demoClass, undefined), 0, 'calculateGroupPoints handles undefined studentIds gracefully');
assertEqual(store.calculateGroupPoints(demoClass, []), 0, 'calculateGroupPoints handles empty array gracefully');
assertEqual(store.calculateGroupPoints(demoClass, ['non_existent_id']), 0, 'calculateGroupPoints returns 0 for non-existent student IDs');
assertEqual(store.calculateGroupPoints(demoClass, ['non_existent_id', 'stu_demo_1']), -3, 'calculateGroupPoints skips non-existent IDs and includes valid students');
assertEqual(store.calculateGroupPoints(demoClass, [null, undefined, '', 12345]), 0, 'calculateGroupPoints ignores non-string or null elements in studentIds');

// Edge case: student object corrupted with non-number points
demoClass.students.push({ id: 'stu_corrupt_1', name: 'Corrupt', points: 'invalid_string' });
demoClass.students.push({ id: 'stu_corrupt_2', name: 'CorruptNull', points: null });
assertEqual(store.calculateGroupPoints(demoClass, ['stu_corrupt_1', 'stu_corrupt_2']), 0, 'calculateGroupPoints ignores students with non-numeric points');

// Clean up corrupt students
demoClass.students = demoClass.students.filter(s => !s.id.startsWith('stu_corrupt'));

// 1.7 Group Deletion
console.log('\n[1.7 Hive Group Deletion]');
const deleteSuccess = store.deleteHiveGroup(classId, newGroup.id);
assertEqual(deleteSuccess, true, 'deleteHiveGroup returns true on successful deletion');
const groupStillExists = demoClass.groups.some(g => g.id === newGroup.id);
assertEqual(groupStillExists, false, 'Group no longer exists in class.groups');
const deleteNonExistent = store.deleteHiveGroup(classId, 'non_existent_group');
assertEqual(deleteNonExistent, false, 'deleteHiveGroup returns false for non-existent group');


// ============================================================================
// SUITE 2: IDEMPOTENCY OF PORTFOLIO SUBMISSION APPROVAL
// ============================================================================
console.log('\n--- SUITE 2: IDEMPOTENCY OF PORTFOLIO SUBMISSION APPROVAL ---');

store.resetDemoData();
const freshClass = store.getActiveClass();
const freshClassId = freshClass.id;

// Create a target student with known points
const targetStudent = freshClass.students.find(s => s.id === 'stu_demo_3');
const initialStuPoints = targetStudent.points;
const initialClassPoints = freshClass.totalPoints;
const initialStuHistoryLen = targetStudent.history.length;
const initialStoriesLen = store.state.stories.length;

// Create a pending submission for stu_demo_3
console.log('\n[2.1 Creating Pending Submission & First Approval]');
const pendingSub = store.createPortfolioWork({
  classId: freshClassId,
  studentId: 'stu_demo_3',
  studentName: 'Jennifer',
  title: '🌸 向日葵花粉傳遞實驗記錄',
  typeTag: 'science',
  outcomeText: '今天用顯微鏡觀察了向日葵的花粉粒，呈現金色細長顆粒！',
  reflection: '觀察到花粉容易附著在小蜜蜂的絨毛上。',
  mediaData: 'data:image/svg+xml;utf8,<svg><circle cx="50" cy="50" r="40" fill="gold"/></svg>'
});

assert(pendingSub !== null, 'Created pending submission');
assertEqual(pendingSub.status, 'pending', 'Submission status is pending');
assertEqual(pendingSub.honeyPoints, 0, 'Initial submission honeyPoints is 0');

// Call 1: First approval with 3 honey points and publishToStory
const firstApprovalResult = store.approvePortfolioSubmission(pendingSub.activityId, pendingSub.id, {
  feedback: '顯微鏡觀察非常精準，筆記詳實！',
  flowerSticker: '🌸 構思精巧花',
  points: 3,
  publishToStory: true
});

assert(firstApprovalResult !== null, 'approvePortfolioSubmission returned updated submission');
assertEqual(firstApprovalResult.status, 'approved', 'Submission status is approved after first call');
assertEqual(targetStudent.points, initialStuPoints + 3, 'Student points incremented by exactly 3 after first call');
assertEqual(freshClass.totalPoints, initialClassPoints + 3, 'Class total points incremented by exactly 3 after first call');
assertEqual(targetStudent.history.length, initialStuHistoryLen + 1, 'Student history has 1 new record after first call');
assertEqual(store.state.stories.length, initialStoriesLen + 1, 'Stories array has 1 new story post after first call');
assertEqual(firstApprovalResult.isPublishedToStory, true, 'isPublishedToStory is true');

// Call 2: Second successive call with identical parameters
console.log('\n[2.2 Second Successive Approval Call (Idempotency Check)]');
const secondApprovalResult = store.approvePortfolioSubmission(pendingSub.activityId, pendingSub.id, {
  feedback: '顯微鏡觀察非常精準，筆記詳實！',
  flowerSticker: '🌸 構思精巧花',
  points: 3,
  publishToStory: true
});

assertEqual(secondApprovalResult.status, 'approved', 'Submission status remains approved');
assertEqual(targetStudent.points, initialStuPoints + 3, 'CRITICAL: Student points DID NOT increase on 2nd call (idempotent)');
assertEqual(freshClass.totalPoints, initialClassPoints + 3, 'CRITICAL: Class total points DID NOT increase on 2nd call');
assertEqual(targetStudent.history.length, initialStuHistoryLen + 1, 'CRITICAL: No duplicate history item added on 2nd call');
assertEqual(store.state.stories.length, initialStoriesLen + 1, 'CRITICAL: No duplicate story post created on 2nd call');

// Successive Calls 3 through 25 in a loop (Stress Idempotency)
console.log('\n[2.3 Massive Successive Calls Stress (Calls 3 to 25)]');
for (let i = 3; i <= 25; i++) {
  store.approvePortfolioSubmission(pendingSub.activityId, pendingSub.id, {
    feedback: `重複確認第 ${i} 次`,
    flowerSticker: '🌸 構思精巧花',
    points: 3,
    publishToStory: true
  });
}

assertEqual(targetStudent.points, initialStuPoints + 3, 'Student points strictly invariant after 25 successive calls');
assertEqual(freshClass.totalPoints, initialClassPoints + 3, 'Class total points strictly invariant after 25 successive calls');
assertEqual(targetStudent.history.length, initialStuHistoryLen + 1, 'Student history count strictly invariant after 25 successive calls');
assertEqual(store.state.stories.length, initialStoriesLen + 1, 'Stories count strictly invariant after 25 successive calls');

// 2.4 Successive call with DIFFERENT points on already approved submission
console.log('\n[2.4 Successive Call with Altered Points (Parameter Modification)]');
// Attempting to change points on already approved submission should NOT award extra points
store.approvePortfolioSubmission(pendingSub.activityId, pendingSub.id, {
  feedback: '修改評語但已核准',
  flowerSticker: '⭐ 卓越之星花',
  points: 5, // Try to award 5 points
  publishToStory: true
});

assertEqual(targetStudent.points, initialStuPoints + 3, 'Student points remained at initial award; did not re-award +5');
assertEqual(freshClass.totalPoints, initialClassPoints + 3, 'Class total points remained invariant');
assertEqual(targetStudent.history.length, initialStuHistoryLen + 1, 'History length remains invariant');
assertEqual(pendingSub.honeyPoints, 5, 'Submission record metadata updated to reflected revised points (5)');
assertEqual(pendingSub.flowerSticker, '⭐ 卓越之星花', 'Submission sticker metadata updated to revised sticker');

// 2.5 Approval with 0 or Negative Points
console.log('\n[2.5 Approval with 0 or Negative Points]');
const pendingSub2 = store.createPortfolioWork({
  classId: freshClassId,
  studentId: 'stu_demo_4',
  studentName: 'Justin',
  title: '零分作品測試',
  typeTag: 'writing'
});
const stu4 = freshClass.students.find(s => s.id === 'stu_demo_4');
const stu4PointsBefore = stu4.points;

store.approvePortfolioSubmission(pendingSub2.activityId, pendingSub2.id, { points: 0 });
assertEqual(stu4.points, stu4PointsBefore, 'Approving with 0 points awards 0 points to student');
assertEqual(pendingSub2.status, 'approved', 'Submission status updated to approved');

const pendingSub3 = store.createPortfolioWork({
  classId: freshClassId,
  studentId: 'stu_demo_4',
  studentName: 'Justin',
  title: '負分嘗試測試',
  typeTag: 'writing'
});
store.approvePortfolioSubmission(pendingSub3.activityId, pendingSub3.id, { points: -5 });
assertEqual(stu4.points, stu4PointsBefore, 'Approving with negative points does NOT deduct student points (guard: points > 0)');

// 2.6 Legacy Positional Arguments Signature Compatibility
console.log('\n[2.6 Legacy Positional Parameters Signature]');
const pendingSub4 = store.createPortfolioWork({
  classId: freshClassId,
  studentId: 'stu_demo_5',
  studentName: 'Leonardo',
  title: '舊格式參數核准測試',
  typeTag: 'drawing'
});
const stu5 = freshClass.students.find(s => s.id === 'stu_demo_5');
const stu5PointsBefore = stu5.points;

// Legacy call: (activityId, submissionId, feedback, flowerSticker, publishToStory)
store.approvePortfolioSubmission(
  pendingSub4.activityId,
  pendingSub4.id,
  '舊格式相容性評語',
  '🌸 巧思花',
  false // do not publish to story
);

assertEqual(pendingSub4.status, 'approved', 'Approved via legacy positional parameters');
assertEqual(pendingSub4.teacherFeedback, '舊格式相容性評語', 'Feedback recorded via positional parameter');
assertEqual(stu5.points, stu5PointsBefore + 2, 'Default 2 points awarded via legacy signature');


// ============================================================================
// SUITE 3: PORTFOLIO CREATION EDGE CASES & DATA INTEGRITY
// ============================================================================
console.log('\n--- SUITE 3: PORTFOLIO CREATION EDGE CASES & ROBUSTNESS ---');

// 3.1 Edge Case Strings: Unicode, Emojis, RTL, Special Chars, HTML Payloads
console.log('\n[3.1 Multilingual, Unicode, Emojis, RTL, XSS Payloads]');
const edgeCaseInputs = [
  {
    name: 'Traditional & Simplified Chinese with Poetic Quotes',
    title: '🌻 向日葵花海的記憶：《春華秋實》與【青青草地】',
    outcomeText: '天地玄黃，宇宙洪荒。日月盈昃，辰宿列張。寒來暑往，秋收冬藏。',
    reflection: '體會到了中文書法的美感與大自然的奧秘。'
  },
  {
    name: 'Japanese Kanji, Hiragana & Katakana',
    title: '🇯🇵 桜の花びらとミツバチの旅 — 春の観察日記',
    outcomeText: 'ミツバチが一生懸命に蜜を集めています。とてもかわいいです。',
    reflection: '自然の美しさと蜂の役割について深く学びました。'
  },
  {
    name: 'Korean Hangul',
    title: '🇰🇷 꿀벌의 하루 관찰 보고서',
    outcomeText: '꿀벌들이 꽃가루를 모으는 모습이 정말 신기했습니다.',
    reflection: '친구들과 함께 자연을 탐구하는 시간이 유익했습니다.'
  },
  {
    name: 'Arabic (Right-to-Left)',
    title: 'تقرير عن النحل وعسل النحل في الحديقة 🌸',
    outcomeText: 'لقد شاهدت النحل يجمع الرحيق من الأزهار الجميلة اليوم.',
    reflection: 'كانت تجربة رائعة وممتعة للغاية مع زملائي.'
  },
  {
    name: 'Dense Emojis & Complex Surrogate Pairs',
    title: '🐝🌻🍯🚀✨🎨👩‍🏫👨‍🎓🌈🎉💯💥⚠️❤️🔥',
    outcomeText: '👨‍👩‍👧‍👦 🏳️‍🌈 🧑🏽‍💻 🐝 🌸 🍯 🎯 💡 👑 🦄 🍀 🍕 🍦 🏆',
    reflection: '🤩🥳🤠🤖👾🎃'
  },
  {
    name: 'HTML & Script Injection Strings (XSS Resilience)',
    title: '<script>alert("xss")</script><b>Bold Title</b>',
    outcomeText: '<img src="x" onerror="alert(1)">"><svg/onload=alert(document.cookie)>',
    reflection: '\'; DROP TABLE students; -- \' OR 1=1; alert("sql_xss");'
  },
  {
    name: 'Whitespace Only and Empty Strings',
    title: '   ',
    outcomeText: '',
    reflection: '\t\n\r  '
  },
  {
    name: 'Extreme Length String (20,000 characters)',
    title: 'SuperLongTitle_' + 'A'.repeat(500),
    outcomeText: '蜜蜂採蜜'.repeat(5000), // ~20,000 chars
    reflection: '反思記錄'.repeat(2500) // ~10,000 chars
  }
];

edgeCaseInputs.forEach((item, idx) => {
  const sub = store.createPortfolioWork({
    classId: freshClassId,
    studentId: 'stu_demo_1',
    studentName: 'Beyoncé',
    title: item.title,
    typeTag: 'drawing',
    outcomeText: item.outcomeText,
    reflection: item.reflection,
    mediaData: 'data:image/svg+xml;utf8,<svg></svg>'
  });

  assert(sub !== null, `Created submission ${idx + 1}: ${item.name}`);
  assert(typeof sub.id === 'string' && sub.id.length > 5, `Submission has valid generated ID: ${sub.id}`);
  
  if (item.title && item.title.trim().length > 0) {
    assertEqual(sub.title, item.title.trim(), `Title preserved exactly: ${item.name}`);
  } else {
    assertEqual(sub.title, '我的蜂巢學習作品', `Empty title cleanly defaulted to default title`);
  }
});

// 3.2 Null, Undefined, and Missing Fields
console.log('\n[3.2 Null, Undefined, and Missing Field Handling]');

const nullSub = store.createPortfolioWork({
  classId: null, // should default to activeClassId
  studentId: 'stu_demo_2',
  studentName: null,
  title: null,
  typeTag: null,
  outcomeText: null,
  reflection: null,
  mediaData: null,
  activityId: null
});

assert(nullSub !== null, 'createPortfolioWork does not crash with all null options');
assertEqual(nullSub.classId, store.state.activeClassId, 'null classId safely defaulted to activeClassId');
assertEqual(nullSub.title, '我的蜂巢學習作品', 'null title safely defaulted to fallback title');
assertEqual(nullSub.typeTag, 'drawing', 'null typeTag safely defaulted to "drawing"');
assertEqual(nullSub.outcomeText, '', 'null outcomeText safely defaulted to empty string');
assertEqual(nullSub.reflection, '', 'null reflection safely defaulted to empty string');
assertEqual(nullSub.mediaUrl, '', 'null mediaData safely defaulted to empty string');
assertEqual(nullSub.status, 'pending', 'Status initialized to pending');

// Empty object call
const emptySub = store.createPortfolioWork({});
assert(emptySub !== null, 'createPortfolioWork does not crash with empty object argument');
assertEqual(emptySub.title, '我的蜂巢學習作品', 'Empty object call receives default title');

// 3.3 Bulk Creation & Querying Integrity
console.log('\n[3.3 Bulk Volume Creation & Querying (100 items)]');
const bulkCount = 100;
for (let i = 0; i < bulkCount; i++) {
  store.createPortfolioWork({
    classId: freshClassId,
    studentId: i % 2 === 0 ? 'stu_demo_1' : 'stu_demo_2',
    studentName: i % 2 === 0 ? 'Beyoncé' : 'Denzel',
    title: `批次作品測試第 ${i + 1} 號`,
    typeTag: ['drawing', 'writing', 'science', 'reading', 'stem'][i % 5],
    outcomeText: `批次成果文本 ${i + 1}`,
    reflection: `批次反思心得 ${i + 1}`
  });
}

const allClassSubs = store.getAllSubmissions(freshClassId);
assert(allClassSubs.length >= bulkCount, `getAllSubmissions retrieved at least ${bulkCount} submissions (Actual: ${allClassSubs.length})`);

// Verify ordering: timestamps must be descending (b.timestamp - a.timestamp)
let isOrderedDesc = true;
for (let i = 1; i < allClassSubs.length; i++) {
  if (allClassSubs[i - 1].timestamp < allClassSubs[i].timestamp) {
    isOrderedDesc = false;
    break;
  }
}
assert(isOrderedDesc, 'getAllSubmissions returned list strictly sorted in descending timestamp order');

// Verify student filter
const student1Subs = store.getAllSubmissions(freshClassId, 'stu_demo_1');
const allAreStu1 = student1Subs.every(s => s.studentId === 'stu_demo_1');
assert(allAreStu1, 'getAllSubmissions with studentId filter returns exclusively that student\'s submissions');

// 3.4 Schema Invariant Check (adaptSubmission contract)
console.log('\n[3.4 Schema Invariants via adaptSubmission]');
const sampleSub = allClassSubs[0];
const requiredFields = [
  'id', 'classId', 'activityId', 'activityTitle', 'studentId', 'studentName',
  'title', 'typeTag', 'outcomeText', 'reflection', 'mediaUrl', 'drawingData',
  'caption', 'status', 'timestamp', 'teacherFeedback', 'flowerSticker',
  'honeyPoints', 'reviewedAt', 'isPublishedToStory', 'isPublishedToParent',
  'parentLikes', 'revisionNote'
];

let allFieldsPresent = true;
const missingFields = [];
requiredFields.forEach(f => {
  if (sampleSub[f] === undefined) {
    allFieldsPresent = false;
    missingFields.push(f);
  }
});
assert(allFieldsPresent, `All 23 required schema fields present in adaptSubmission (Missing: ${missingFields.join(', ') || 'none'})`);

// 3.5 Persistence Serialization Verification
console.log('\n[3.5 Storage Serialization Roundtrip Check]');
store.save();
const serialized = storage.get(`dojo_store_classdojo_system_v1`);
assert(typeof serialized === 'string' && serialized.length > 1000, 'State successfully serialized into localStorage');

let deserializedState = null;
let jsonParsable = false;
try {
  deserializedState = JSON.parse(serialized);
  jsonParsable = true;
} catch (e) {
  jsonParsable = false;
}
assert(jsonParsable, 'Serialized state is 100% valid JSON without parsing errors');
assert(Array.isArray(deserializedState.portfolios), 'Deserialized state contains valid portfolios array');
assert(Array.isArray(deserializedState.classes), 'Deserialized state contains valid classes array');

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total Assertions : ${totalTests}`);
console.log(`Passed           : ${passedTests}`);
console.log(`Failed           : ${failedTests}`);

if (failedTests > 0) {
  console.error('\nFAILURES:');
  failures.forEach((f, idx) => console.error(`  ${idx + 1}. ${f}`));
  console.log('\nVERDICT: REQUEST_CHANGES');
  process.exitCode = 1;
} else {
  console.log('\nALL EMPIRICAL TESTS PASSED PERFECTLY!');
  console.log('VERDICT: APPROVE');
  process.exitCode = 0;
}
