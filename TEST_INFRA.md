# Test Infrastructure Specification: Crew (ClassDojo Bee Hive Edition)

## 1. Executive Summary & Testing Philosophy

This document defines the automated end-to-end (E2E) testing infrastructure for the **Crew (ClassDojo Bee Hive Edition)** educational web platform. In accordance with the project requirements (`ORIGINAL_REQUEST.md`, `PROJECT.md`), User Global Rules, and the 4-Tier Test Architecture methodology, our testing strategy guarantees:

1. **Dual-Viewport Parity**: Automated verification on both **Desktop (1280×800)** and **Mobile (393×852 touch emulation with `isMobile: true, hasTouch: true`)** across all four portal views (`index.html`, `teacher.html`, `student.html`, `parent.html`).
2. **Zero-Facade Integrity**: Every test exercises real DOM interactions, real state mutations through `DojoStore`, real canvas drawing strokes, and real event dispatching. Mock/stub facades that auto-pass are strictly prohibited.
3. **Data Safety Assurance**: Strict assertion of the "Zero Data Alteration" rule ensuring user namespaces remain untampered and isolated within `dojo_store_classdojo_system_v1` and `crew_sound_enabled`.
4. **Visual & Aesthetic Compliance**: Automated DOM audits verifying the replacement of crude unstyled emojis with professional FontAwesome 6 icons (`fa-solid`, `fa-regular`) matching ClassDojo SaaS standards.

---

## 2. Test Architecture & Runtime Environment

### 2.1 Test Runner Specification
- **Engine**: Node.js CommonJS runner (`test_e2e_runner.cjs`) using `puppeteer-core`.
- **Browser Binary**: macOS system Google Chrome (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`).
- **Static Server**: Embedded Node.js native `http.createServer` listening on `http://localhost:8124`, serving static files with proper MIME types without external framework dependencies.
- **Headless Mode**: Headless Chrome with security and rendering flags (`--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`).
- **Artifact Pipeline**: High-resolution PNG screenshots captured at each milestone state and stored in `screenshots_e2e/`.

### 2.2 Viewport Configuration Matrix

| Device Profile | Dimensions | Device Scale Factor | Touch Support | Mobile UserAgent | User Target |
|----------------|------------|---------------------|---------------|------------------|-------------|
| **Desktop** | 1280 × 800 | 1.0 | False | Standard Desktop | Classroom Whiteboard, Teacher Laptop, Parent Desktop |
| **Mobile (User Rule 2)** | 393 × 852 | 3.0 | True (`isMobile: true, hasTouch: true`) | iPhone 14 / Modern Smartphone | Parent Mobile App, Student Mobile Hub, Teacher On-the-Go |

---

## 3. The 4-Tier Test Classification

```
+-------------------------------------------------------------------------------+
|                        Tier 4: Real-World Scenarios                           |
|       End-to-End Persona Journeys (Teacher, Student, Parent Classroom Day)     |
+-------------------------------------------------------------------------------+
                                        |
+-------------------------------------------------------------------------------+
|                   Tier 3: Cross-Feature Integration Contracts                 |
|       Student Work -> Teacher Review -> Parent Wall | Group Points -> Student |
+-------------------------------------------------------------------------------+
                                        |
+-------------------------------------------------------------------------------+
|                    Tier 2: Boundary & Edge Stress Tests                       |
|   Empty Inputs | Idempotent Points | Canvas Dirty State | Single-Student Grp  |
+-------------------------------------------------------------------------------+
                                        |
+-------------------------------------------------------------------------------+
|                     Tier 1: Feature Coverage (Unit & DOM)                     |
|  Portfolios | Hive Groups | Leaderboard | Projector | FontAwesome | Auth     |
+-------------------------------------------------------------------------------+
```

### 3.1 Tier 1: Feature Coverage

Tier 1 validates discrete functional components and user interfaces across Desktop and Mobile:

#### F1: Fixed Authentication & Quick Login Flow
- **Target**: `index.html` (`#btn-hero-demo`, `#login-modal`, `#login-username`, `#login-password`, `#btn-submit-login`).
- **Assertion**:
  - Username field prefilled with `antigravity`.
  - Password field prefilled with `123456`.
  - Submit triggers success sound (`dojoAudio.playPositive()`), confetti burst (`dojoConfetti.burst()`), and redirects to target portal without console error.

#### F2: Homepage Changelog Maintenance
- **Target**: `index.html` (`.changelog-card`, `.changelog-version-tag`, `CHANGELOG_DATA` via `js/changelog.js`).
- **Assertion**:
  - Renders latest release version containing portfolios, hive groups, and FontAwesome upgrade descriptions.
  - Preserves historic versions in chronological sequence.

#### F3: Teacher Hive Groups Switch & Management
- **Target**: `teacher.html` (`#btn-switch-groups`, `#btn-switch-students`, `#groups-grid`, `.group-team-card`).
- **Assertion**:
  - Clicking `#btn-switch-groups` hides `#students-grid` and reveals `#groups-grid`.
  - Group cards render group title, member bee avatars, current honey points, and feedback action button.

#### F4: Hive Collaborative Leaderboard & Live Progress Bar
- **Target**: `teacher.html` (`#hive-leaderboard-card`, `.hive-progress-bar-fill`, ranking badges 👑/🥈/🥉).
- **Assertion**:
  - Displays groups sorted by total points descending.
  - Progress bar width scales proportionally to `(points / goalPoints) * 100%`.
  - Micro-animation gradient applies smoothly.

#### F5: Hive Group One-Click Collaborative Feedback
- **Target**: `teacher.html` (`.group-team-card`, `.skill-btn[data-skill-id]`).
- **Assertion**:
  - Clicking a group card opens group skill feedback modal.
  - Selecting a collaborative skill invokes `store.awardHiveGroupPoint(classId, groupId, skill)` which increments points for all members, increments class total, and refreshes the leaderboard.

#### F6: Classroom Projector Large-Screen Competition Mode
- **Target**: `teacher.html` (`#btn-projector-mode`, `#projector-groups-modal`, `#btn-close-projector`).
- **Assertion**:
  - Clicking `#btn-projector-mode` opens large-screen projector modal with high-contrast bee hive theme.
  - Displays all competing groups with enlarged progress bars and real-time point badges.
  - Close button dismisses modal cleanly.

#### F7: Student Digital Portfolio Creation & Drawing Canvas
- **Target**: `student.html` (`#tab-student-portfolio` / `#mob-stu-portfolio`, `#drawing-canvas`, `#drawing-caption`, `#btn-submit-drawing`, `#my-submissions-list`).
- **Assertion**:
  - Student accesses drawing pad, draws vector strokes with mouse/touch drag events.
  - Inputs reflection caption and clicks submit.
  - Submission appears in `#my-submissions-list` with `status: pending` badge.

#### F8: Teacher Portfolio Review Center & Flower Sticker Award
- **Target**: `teacher.html` (`#tab-btn-portfolios`, `#view-portfolios`, `#portfolios-list`, `#portfolio-review-modal`).
- **Assertion**:
  - Teacher navigates to Portfolios view.
  - Pending submission shows up with student name, artwork thumbnail, and caption.
  - Clicking review opens `#portfolio-review-modal` (Modal 13).
  - Teacher can select flower sticker chip (e.g. `🌸 構思精巧花`), preset feedback comment, and click `#btn-confirm-approve`.
  - Submission updates to `status: approved` and awards +2 honey points.

#### F9: Parent Portfolio Showcase Wall & Appreciation
- **Target**: `parent.html` (`#parent-portfolio-list`, `.portfolio-card`).
- **Assertion**:
  - Parent view loads approved student work.
  - Displays work image, student reflection, teacher comment, flower badge, and honey point reward.
  - Clicking like button increments like counter with positive feedback.

#### F10: Student Portal Hive Group Tab
- **Target**: `student.html` (`#tab-student-group` / `#mob-stu-group`, `#view-student-group`).
- **Assertion**:
  - Student views their assigned group, teammate roster, class standing, and honey goal progress.

#### F11: FontAwesome Aesthetic & De-AI Verification
- **Target**: All pages (`index.html`, `teacher.html`, `student.html`, `parent.html`).
- **Assertion**:
  - Buttons and action links do NOT contain raw unformatted AI emojis as lone icons.
  - Valid FontAwesome 6 elements (`<i class="fa-solid ...">` or `<i class="fa-regular ...">`) are present on navigation buttons, action chips, and status badges.

#### F12: Zero Data Alteration Verification
- **Target**: Browser `localStorage`.
- **Assertion**:
  - Inspecting `Object.keys(localStorage)` confirms ONLY `dojo_store_classdojo_system_v1` and `crew_sound_enabled` are utilized.
  - No unrelated keys are added, overwritten, or cleared.

---

### 3.2 Tier 2: Boundary & Edge Stress Tests

| Edge Test ID | Scenario | Expected Behavior |
|--------------|----------|-------------------|
| **E-01** | Student submits portfolio with empty title/caption | Form displays validation warning or prompts input; does not crash or create corrupted submissions in store. |
| **E-02** | Student submits clean (untouched) canvas | System gracefully accepts or supplies fallback vector art; no `data:image/svg+xml` parsing error. |
| **E-03** | Teacher re-approves an already approved submission | Idempotency guard prevents duplicate points award to student balance; total points remain consistent. |
| **E-04** | Group with zero initial points | Progress bar renders at 0% width with min-width safety; no negative widths or CSS layout overflow. |
| **E-05** | Group with points exceeding 100% of goal | Progress bar caps at 100% visual fill or displays honey overflow celebration badge without clipping. |
| **E-06** | Student with no assigned hive group | Student Hive Group tab renders a friendly prompt ("尚未加入小組，請老師協助分組") without null reference errors. |
| **E-07** | LocalStorage reset button clicked | Only `dataEngine.storageKey` is reset; global `localStorage.clear()` is NEVER executed. |

---

### 3.3 Tier 3: Cross-Feature Integration Contracts

#### Contract 1: Student-Teacher-Parent Portfolio Triangle
```
[Student creates & submits work]
         │
         ▼
[DojoStore.createPortfolioWork] ──> Saves with status: 'pending'
         │
         ▼
[Teacher Portfolio Review Center] ──> Displays work in pending queue
         │
         ▼
[Teacher approves in Modal 13] ──> Calls DojoStore.approvePortfolioSubmission
         ├── 1. Updates submission status to 'approved'
         ├── 2. Awards +2 honey points to Student (DojoStore.awardStudentPoint)
         ├── 3. Appends approval entry to Student point history
         └── 4. Publishes highlight post to Hive Class Story (if checked)
         │
         ▼
[Parent Portal loads] ──> Queries approved submissions for active child
         ├── Displays artwork, reflection, flower sticker, teacher feedback
         └── Parent clicks like -> Persists like count in submission record
```

#### Contract 2: Hive Group Collaborative Point Distribution
```
[Teacher selects Hive Group Card]
         │
         ▼
[Teacher selects Collaboration Skill (e.g. +2 Teamwork)]
         │
         ▼
[DojoStore.awardHiveGroupPoint]
         ├── 1. Loops through all studentIds in the group
         ├── 2. Increments each student's personal point balance (+2)
         ├── 3. Logs point history entry for each student with group tag
         ├── 4. Increments class total points (+2 * memberCount)
         └── 5. Recalculates group aggregate score
         │
         ▼
[Responsive UI Updates]
         ├── Teacher Leaderboard: Group moves up rank, progress bar fills
         ├── Projector Modal: Live progress bar animates with confetti
         └── Student Group Tab: Teammate points and group standing refresh
```

---

### 3.4 Tier 4: Real-World Scenarios (Persona Journeys)

#### Journey A: Teacher Morning Hive Session
1. Teacher launches Crew, clicks quick demo login (`antigravity` / `123456`).
2. Switches view to **Hive Groups** (`#btn-switch-groups`), checks morning group rankings.
3. Notices "向日葵偵查小隊" completed morning reading, clicks group card, awards +2 collaborative honey points.
4. Opens **Classroom Projector Mode** (`#btn-projector-mode`) to display the live competition standings on the big screen.
5. Dismisses projector mode and transitions to review homework.

#### Journey B: Student Afternoon Reflection & Creation
1. Student Beyoncé logs into Student Workshop.
2. Hatches pet monster egg if fresh session.
3. Opens **Portfolio Tab** (`#tab-student-portfolio` / `#mob-stu-portfolio`).
4. Uses canvas drawing tools (yellow, green, thick brush) to paint a sunflower bee.
5. Enters reflection: *"向日葵小隊今天採集了好多花蜜，我們合作非常順利！"*.
6. Submits work and verifies it appears in "我已繳交的歷程作品" with status `⏳ 待審核`.
7. Checks **Hive Group Tab** (`#tab-student-group`) to celebrate team's standing.

#### Journey C: Teacher Review & Parent Evening Connection
1. Teacher switches to **Student Portfolios Tab** (`#tab-btn-portfolios`).
2. Locates Beyoncé's submission in `#portfolios-list`.
3. Opens `#portfolio-review-modal`, selects flower sticker `🌸 構思精巧花`, inserts preset comment *"筆觸生動細膩，色彩搭配非常和諧，給小蜜蜂大大的讚！"*.
4. Clicks `#btn-confirm-approve` with sync to Class Story enabled.
5. In the evening, parent opens `parent.html`.
6. Parent sees approved portfolio card with flower badge, +2 honey points, and teacher praise.
7. Parent clicks like button to celebrate child's achievement.

---

## 4. Test Execution & Assertion Rules

### 4.1 Strict Assertion Specifications

1. **DOM Existence & Visibility**: Selectors must resolve to non-null DOM nodes and have `display !== 'none'` when active.
2. **State Verification**: State changes must be verified through both DOM reflection and underlying `localStorage` JSON inspection.
3. **Screenshot Delivery**: Every test stage produces dual-viewport screenshots with deterministic naming:
   - `01_index_portal_desktop.png` / `01_index_portal_mobile_393x852.png`
   - `01_login_modal_desktop.png` / `01_login_modal_mobile_393x852.png`
   - `02_teacher_classroom_desktop.png` / `02_teacher_classroom_mobile_393x852.png`
   - `02_groups_view_desktop.png` / `02_groups_view_mobile_393x852.png`
   - `02_projector_groups_modal_desktop.png` / `02_projector_groups_modal_mobile_393x852.png`
   - `02_portfolio_review_modal_desktop.png` / `02_portfolio_review_modal_mobile_393x852.png`
   - `03_student_workshop_desktop.png` / `03_student_workshop_mobile_393x852.png`
   - `03_student_hive_group_desktop.png` / `03_student_hive_group_mobile_393x852.png`
   - `03_drawing_canvas_desktop.png` / `03_drawing_canvas_mobile_393x852.png`
   - `04_parent_portal_desktop.png` / `04_parent_portal_mobile_393x852.png`
   - `04_parent_portfolio_desktop.png` / `04_parent_portfolio_mobile_393x852.png`

---

## 5. Test Runner Command Guide

```bash
# Execute master E2E test runner
node test_e2e_runner.cjs

# Verify runner syntax without browser launch
node -c test_e2e_runner.cjs
```

---
*Created by `test_writer_e2e` for Crew (ClassDojo Bee Hive edition) Master Test Track.*
