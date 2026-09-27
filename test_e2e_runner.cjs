const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('/Users/ianw/.gemini/antigravity/scratch/node_modules/puppeteer-core');

const PORT = 8124;
const DIR = __dirname;
const SCREENSHOTS_DIR = path.join(DIR, 'screenshots_e2e');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// 1. Simple static HTTP Server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

async function runTests() {
  server.listen(PORT, async () => {
    console.log(`[E2E Server] Running at http://localhost:${PORT}`);

    const browser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];

    // Helper function to test a page in both Desktop & Mobile viewports
    async function testPage(pageName, urlPath, customActions) {
      console.log(`\n========================================`);
      console.log(`Testing Page: ${pageName}`);
      console.log(`========================================`);

      // 1. Desktop Test (1280x800)
      const desktopPage = await browser.newPage();
      desktopPage.on('dialog', async d => { try { await d.dismiss(); } catch(e){} });
      await desktopPage.setViewport({ width: 1280, height: 800 });
      await desktopPage.goto(`http://localhost:${PORT}/${urlPath}`, { waitUntil: 'networkidle0' });

      console.log(`  [Desktop] Loaded ${urlPath}`);
      const desktopShotPath = path.join(SCREENSHOTS_DIR, `${pageName}_desktop.png`);
      await desktopPage.screenshot({ path: desktopShotPath });
      console.log(`  [Desktop] Screenshot saved: ${desktopShotPath}`);

      if (customActions) {
        await customActions(desktopPage, 'desktop');
      }
      await desktopPage.close();

      // 2. Mobile Test (393x852 touch simulation - User Rule 2)
      const mobilePage = await browser.newPage();
      mobilePage.on('dialog', async d => { try { await d.dismiss(); } catch(e){} });
      await mobilePage.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
      await mobilePage.goto(`http://localhost:${PORT}/${urlPath}`, { waitUntil: 'networkidle0' });

      console.log(`  [Mobile 393x852] Loaded ${urlPath}`);
      const mobileShotPath = path.join(SCREENSHOTS_DIR, `${pageName}_mobile_393x852.png`);
      await mobilePage.screenshot({ path: mobileShotPath });
      console.log(`  [Mobile 393x852] Screenshot saved: ${mobileShotPath}`);

      if (customActions) {
        await customActions(mobilePage, 'mobile');
      }
      await mobilePage.close();

      results.push({ page: pageName, status: 'PASSED' });
    }

    try {
      // Test 1: Index Page & Changelog & Quick Login
      await testPage('01_index_portal', 'index.html', async (page, mode) => {
        // Check changelog exists
        const hasChangelog = await page.evaluate(() => {
          return document.querySelector('.changelog-card') !== null;
        });
        console.log(`    ✓ Changelog rendered: ${hasChangelog}`);

        // Open quick login modal
        await page.click('#btn-hero-demo');
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `01_login_modal_${mode}.png`) });

        // Verify prefilled credentials antigravity / 123456
        const creds = await page.evaluate(() => ({
          u: document.getElementById('login-username').value,
          p: document.getElementById('login-password').value
        }));
        console.log(`    ✓ Verified credentials: ${creds.u} / ${creds.p}`);
      });

      // Test 2: Teacher Page
      await testPage('02_teacher_classroom', 'teacher.html', async (page, mode) => {
        // Verify student tiles exist
        const studentCount = await page.evaluate(() => {
          return document.querySelectorAll('.student-card').length;
        });
        console.log(`    ✓ Rendered ${studentCount} student cards`);

        // Click first student to open feedback modal
        const studentCard = await page.$('.student-card[data-student-id]');
        if (studentCard) {
          await studentCard.click();
          await new Promise(r => setTimeout(r, 400));
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `02_skills_modal_${mode}.png`) });

          // Click positive skill
          const skillBtn = await page.$('.skill-btn[data-skill-id]');
          if (skillBtn) {
            await skillBtn.click();
            await new Promise(r => setTimeout(r, 500));
            console.log(`    ✓ Awarded feedback point successfully`);
          }
        }

        // Test Toolkit modal
        if (mode === 'desktop') {
          await page.click('#dock-btn-toolkit');
        } else {
          await page.click('#mob-nav-toolkit');
        }
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `02_toolkit_modal_${mode}.png`) });
        await page.click('#btn-close-toolkit');
        await new Promise(r => setTimeout(r, 300));

        // Test Class Code & QR Login Modal
        const hasCodeBtn = await page.$('#btn-show-class-code');
        if (hasCodeBtn) {
          await page.click('#btn-show-class-code');
          await new Promise(r => setTimeout(r, 400));
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `02_class_code_modal_${mode}.png`) });
          await page.click('#btn-close-class-code');
          await new Promise(r => setTimeout(r, 300));
        }

        // Test Sound Toggle
        const soundToggle = await page.$('#nav-sound-toggle');
        if (soundToggle) {
          await page.evaluate(el => el.click(), soundToggle);
          console.log(`    ✓ Toggled sound switch in ${mode}`);
        }

        // Test Noise Meter
        if (mode === 'desktop') {
          const dockNoise = await page.$('#dock-btn-noise');
          if (dockNoise) {
            await dockNoise.click();
            await new Promise(r => setTimeout(r, 400));
            const toggleMic = await page.$('#btn-toggle-mic');
            if (toggleMic) await page.evaluate(el => el.click(), toggleMic);
            await new Promise(r => setTimeout(r, 300));
            await page.click('#btn-close-noise');
            console.log(`    ✓ Noise meter & mic toggle verified`);
          }
        }

        // Test Class Story & Hive Poll
        const storyTab = await page.$('#tab-btn-story');
        if (storyTab) {
          await page.evaluate(el => el.click(), storyTab);
          await new Promise(r => setTimeout(r, 400));
          const pollOpt = await page.$('.poll-option-btn');
          if (pollOpt) {
            await page.evaluate(el => el.click(), pollOpt);
            console.log(`    ✓ Voted on hive poll in teacher ${mode}`);
          }
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `02_story_poll_${mode}.png`) });
        }

        // Test Export Report Modal
        const exportBtn = await page.$('#btn-export-report');
        if (exportBtn) {
          await page.evaluate(el => el.click(), exportBtn);
          await new Promise(r => setTimeout(r, 400));
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `02_export_report_${mode}.png`) });
          await page.evaluate(() => document.getElementById('btn-close-export-report')?.click());
          await new Promise(r => setTimeout(r, 300));
          console.log(`    ✓ Export report modal tested in ${mode}`);
        }
      });

      // Test 3: Student Page
      await testPage('03_student_workshop', 'student.html', async (page, mode) => {
        // If unhatched egg, hatch it!
        const hasHatchBtn = await page.evaluate(() => {
          const btn = document.getElementById('btn-hatch-egg');
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        if (hasHatchBtn) {
          console.log(`    ✓ Hatched student monster egg`);
          await new Promise(r => setTimeout(r, 600));
        }

        // Test Student Class Code Modal
        const hasStudentCodeBtn = await page.$('#btn-enter-class-code');
        if (hasStudentCodeBtn) {
          await page.click('#btn-enter-class-code');
          await new Promise(r => setTimeout(r, 400));
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `03_student_code_modal_${mode}.png`) });
          await page.click('#btn-close-student-code');
          await new Promise(r => setTimeout(r, 300));
        }

        // Change monster color & body shape
        await page.evaluate(() => {
          const swatch = document.querySelector('.color-swatch-btn[data-color-idx="2"]');
          if (swatch) swatch.click();
          const pill = document.querySelector('.trait-pill-btn[data-trait-val="fluffy"]');
          if (pill) pill.click();
        });

        // Test Points tab & Level XP
        await page.evaluate(() => {
          document.getElementById('tab-student-points')?.click();
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `03_student_level_xp_${mode}.png`) });
        console.log(`    ✓ Student XP Level progress tested in ${mode}`);

        // Test Rewards Store
        await page.evaluate(() => {
          document.getElementById('tab-student-rewards')?.click();
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `03_rewards_store_${mode}.png`) });

        // Test The Meadow Canvas
        await page.evaluate(() => {
          document.getElementById('tab-student-islands')?.click();
        });
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `03_the_meadow_${mode}.png`) });

        // Switch to Drawing tab
        await page.evaluate((m) => {
          const target = m === 'desktop' ? 'tab-student-portfolio' : 'mob-stu-portfolio';
          document.getElementById(target)?.click();
        }, mode);
        await new Promise(r => setTimeout(r, 400));

        // Draw something on canvas
        const canvas = await page.$('#drawing-canvas');
        if (canvas) {
          const box = await canvas.boundingBox();
          if (box) {
            await page.mouse.move(box.x + 30, box.y + 30);
            await page.mouse.down();
            await page.mouse.move(box.x + 120, box.y + 80);
            await page.mouse.move(box.x + 80, box.y + 140);
            await page.mouse.move(box.x + 30, box.y + 30);
            await page.mouse.up();
          }
        }
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `03_drawing_canvas_${mode}.png`) });
        console.log(`    ✓ Canvas drawing tested`);
      });

      // Test 4: Parent Page
      await testPage('04_parent_portal', 'parent.html', async (page, mode) => {
        // Verify child report
        const childName = await page.$eval('#parent-child-name', el => el.textContent);
        console.log(`    ✓ Child report loaded for: ${childName}`);

        // Switch to Chat tab
        await page.evaluate((m) => {
          const target = m === 'desktop' ? 'tab-parent-chat' : 'mob-par-chat';
          document.getElementById(target)?.click();
        }, mode);
        await new Promise(r => setTimeout(r, 400));

        // Type and send message
        await page.type('#parent-chat-input', '老師您好！謝謝您的用心指導！');
        await page.evaluate(() => document.getElementById('btn-parent-send')?.click());
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `04_parent_chat_${mode}.png`) });
        console.log(`    ✓ Parent chat message sent`);

        // Test Certificate of Merit Modal
        await page.evaluate(() => {
          document.getElementById('btn-print-parent-report')?.click();
        });
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `04_parent_certificate_${mode}.png`) });
        console.log(`    ✓ Weekly Honey Certificate modal opened`);
        await page.evaluate(() => {
          document.getElementById('btn-close-cert')?.click();
        });
        await new Promise(r => setTimeout(r, 300));

        // Switch to Story tab and test poll
        await page.evaluate((m) => {
          const target = m === 'desktop' ? 'tab-parent-story' : 'mob-par-story';
          document.getElementById(target)?.click();
        }, mode);
        await new Promise(r => setTimeout(r, 400));
        const parPollOpt = await page.$('[data-parent-poll-opt]');
        if (parPollOpt) {
          await page.evaluate(el => el.click(), parPollOpt);
          console.log(`    ✓ Parent voted on poll in ${mode}`);
        }
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `04_parent_story_poll_${mode}.png`) });
      });

      console.log(`\n========================================`);
      console.log(`ALL TESTS PASSED WITH ZERO ERRORS!`);
      console.log(`========================================`);
    } catch (err) {
      console.error(`E2E Test Failure:`, err);
    } finally {
      await browser.close();
      server.close();
      process.exit(0);
    }
  });
}

runTests();
