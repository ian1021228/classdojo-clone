# Project: Crew (ClassDojo Bee Hive edition)

## Architecture
- **Tech Stack**: Vanilla HTML5, CSS3 (Modern Flexbox/Grid, Glassmorphism, Micro-animations), JavaScript (ES Modules, Native CustomEvent, Audio API, HTML5 Canvas).
- **Persistence Layer**: `FirebaseDataEngine` in `js/firebase-config.js` (`dojo_store_classdojo_system_v1`), LocalStorage-First with optional Cloud Firestore fallback.
- **Portals**:
  1. Entry & Authentication: `index.html` + `js/changelog.js`
  2. Teacher Hive: `teacher.html` + `js/teacher.js`
  3. Student Bee Hub: `student.html` + `js/student.js`
  4. Parent Connect: `parent.html` + `js/parent.js`
  5. Core State & Data: `js/store.js` + `js/audio.js` + `js/monsters.js`
- **Testing & Release**:
  - Test runner: `test_e2e_runner.cjs` (Desktop 1280×800 & Mobile 393×852 touch emulation via Puppeteer)
  - Remote: `https://github.com/ian1021228/crew-v1.0.git` (branch `main`)
  - Target URL: `https://ian1021228.github.io/crew-v1.0/`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Zero-data-alteration storage fix | Fix `localStorage.clear()` in `index.html` L293 to `store.resetDemoData()` to protect user data | M0 | Survey (Exp 2 & Exp 3) |
| 2 | Store Portfolio Data Model | Add `getAllSubmissions`, `createPortfolioWork`, `approvePortfolioSubmission`, `returnPortfolioSubmission` with defensive loading and backward compatibility | M0 | Survey (Exp 2) |
| 3 | Store Hive Group Data Model | Add `createHiveGroup`, `updateHiveGroup`, `deleteHiveGroup`, `awardHiveGroupPoint`, `calculateGroupPoints` | M0 | Survey (Exp 3) |
| 4 | Global FontAwesome icon migration | Replace 82 static emojis across `index.html`, `teacher.html`, `student.html`, `parent.html` with standard FontAwesome 6 SVG/icons | M1 | Survey (Exp 1) |
| 5 | Dynamic JS template emoji migration | Replace 120+ emoji occurrences in `js/teacher.js`, `js/student.js`, `js/parent.js`, `js/store.js` with FontAwesome 6 icons | M1 | Survey (Exp 1) |
| 6 | ClassDojo visual style & contrast polish | Fix white-on-honey button contrast (< 4.5:1), responsive tabs horizontal scroll, mobile grid fix, micro-animations | M1 | Survey (Exp 1) |
| 7 | Student digital portfolio creation | Support student creation with title, type tags (drawing, writing, science, reading, stem), outcome text, reflection, canvas drawing | M2 | Survey (Exp 2) |
| 8 | Student portfolio wall & feedback view | Display student's submitted works with status badges (approved, pending, needs_revision), flower stickers, honey points, teacher comments | M2 | Survey (Exp 2) |
| 9 | Teacher portfolio review center | Review dashboard with filters (student, status, type), hook up Modal 13 (`#portfolio-review-modal`) with flower stickers, honey points (+1, +2, +3, +5), quick comment chips, custom feedback | M2 | Survey (Exp 2) |
| 10 | Teacher portfolio activity creation | Connect Modal 14 (`#add-activity-modal`) to publish new classroom activities | M2 | Survey (Exp 2) |
| 11 | Parent portfolio showcase wall | Render `#parent-portfolio-list` in `parent.html` with approved works, reflection, flower stickers, teacher comments, and like button | M2 | Survey (Exp 2) |
| 12 | Teacher hive group management | Custom group creation (e.g. 花粉偵察組, 蜜露釀造組), member assignment, group editing and deletion | M3 | Survey (Exp 3) |
| 13 | Hive group collaborative points & ranking | Group one-click collaborative points awarding, group leaderboard, and dynamic progress bar with milestone celebrations | M3 | Survey (Exp 3) |
| 14 | Hive group classroom projector mode | Large-screen projection modal (`#projector-groups-modal`) for interactive classroom competition | M3 | Survey (Exp 3) |
| 15 | Student hive group view | Student portal "🐝 蜂巢小組" tab showing current group, teammates, class ranking, honey progress bar | M3 | Survey (Exp 3) |
| 16 | E2E Testing Suite (Dual Viewport) | Update `test_e2e_runner.cjs` with tests for portfolios, groups, and projection mode on Desktop (1280x800) and Mobile (393x852) | M4 | Survey (Exp 3) |
| 17 | Homepage changelog maintenance | Add new release entry to `js/changelog.js` documenting all aesthetic and functional updates while preserving full history | M4 | Survey (Exp 3) |
| 18 | GitHub main push & Pages verification | Automatic git commit & push to GitHub main and verification of HTTP 200 on GitHub Pages | M4 | Survey (Exp 3) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Data Safety & Store Foundation | Fix `localStorage.clear()` bug, implement defensive schema loaders and Store methods for Portfolios and Hive Groups | none | PLANNED |
| M1 | FontAwesome Aesthetic & Visual De-AI | Replace emojis in HTML and JS templates with FontAwesome 6, fix mobile bottom nav in teacher.html, WCAG AA contrast adjustments | none | PLANNED |
| M2 | Student Digital Portfolios | Student portfolio creation/wall, Teacher review center (Modal 13 & 14), Parent portfolio showcase | M0 | PLANNED |
| M3 | Hive Groups & Collaborative Competition | Teacher group management, collaborative points awarding, leaderboard with progress bars, projector mode, student group view | M0 | PLANNED |
| M4 | Validation, Changelog & GitHub Deployment | Dual-viewport E2E testing (Desktop + Mobile 393x852), changelog update in `js/changelog.js`, git push to GitHub main & Pages verification | M1, M2, M3, TEST_READY.md | PLANNED |

## Interface Contracts
### `store.js` ↔ `student.js`, `teacher.js`, `parent.js`
- `store.getAllSubmissions(classId, studentId)`: returns `Array<Submission>` sorted by `timestamp` desc.
- `store.createPortfolioWork({ classId, studentId, studentName, title, typeTag, outcomeText, reflection, mediaData, activityId })`: returns `newSub`.
- `store.approvePortfolioSubmission(activityId, submissionId, { feedback, flowerSticker, points, publishToStory })`: returns `updatedSub`. Idempotent point award.
- `store.returnPortfolioSubmission(activityId, submissionId, revisionNote)`: returns `updatedSub`.
- `store.createHiveGroup(classId, { name, studentIds, icon, color, goalPoints })`: returns `newGroup`.
- `store.updateHiveGroup(classId, groupId, updates)`: returns `updatedGroup`.
- `store.deleteHiveGroup(classId, groupId)`: returns `boolean`.
- `store.awardHiveGroupPoint(classId, groupId, skill)`: increments points for all members, updates class total and group points, returns `{ group, awardedCount }`.

### Submission Schema
```typescript
interface Submission {
  id: string;
  classId: string;
  activityId: string;
  studentId: string;
  studentName: string;
  title: string;
  typeTag: 'drawing' | 'writing' | 'science' | 'reading' | 'stem';
  outcomeText: string;
  reflection: string;
  mediaUrl: string;
  drawingData?: string;
  caption?: string;
  status: 'pending' | 'approved' | 'needs_revision';
  timestamp: number;
  teacherFeedback: string;
  flowerSticker: string;
  honeyPoints: number;
  reviewedAt: number | null;
  isPublishedToStory: boolean;
  revisionNote?: string;
  parentLikes?: number;
}
```

### Hive Group Schema
```typescript
interface HiveGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  studentIds: string[];
  points: number;
  goalPoints: number;
  createdAt: number;
}
```

## Code Layout
- `index.html`: Entry portal, login modal, changelog modal, data safety guarantee.
- `teacher.html`: Teacher classroom view, modals (13 review, 14 activity, custom group, projector).
- `student.html`: Student bee workshop, portfolio creation & wall, hive group view.
- `parent.html`: Parent report, portfolio gallery, child progress.
- `css/style.css` & `css/dojo-ui.css`: Design system, ClassDojo styling, responsive rules.
- `js/store.js`: Central state machine and business logic.
- `js/teacher.js`: Teacher portal controller.
- `js/student.js`: Student portal controller.
- `js/parent.js`: Parent portal controller.
- `js/changelog.js`: Release notes and history.
- `test_e2e_runner.cjs`: Dual-viewport Puppeteer E2E test suite.
