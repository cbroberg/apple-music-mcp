/**
 * E2E Screenshot Quiz Test — Playwright
 *
 * Runs a full quiz with screenshots of every question + answer on both host and player.
 * Saves screenshots + logs for post-test validation.
 *
 * Usage: node scripts/e2e-screenshot-test.js [questions=5]
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const QUESTIONS = parseInt(process.argv[2]) || 5;
const TIMER = 20;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = `recordings/e2e-screenshots-${timestamp}`;
mkdirSync(outDir, { recursive: true });

const testLog = [];
function log(msg) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${msg}`);
  testLog.push({ ts, msg });
}

async function screenshot(page, name) {
  const path = `${outDir}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  log(`📸 ${name}`);
  return path;
}

async function main() {
  log(`\n🎮 E2E Screenshot Test — ${QUESTIONS} questions\n`);
  log(`📁 Output: ${outDir}`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-position=0,25', '--window-size=1400,900'],
  });
  const hostCtx = await browser.newContext({ viewport: { width: 1400, height: 850 } });
  const hostPage = await hostCtx.newPage();

  const playerBrowser = await chromium.launch({
    headless: false,
    args: ['--window-position=1420,25', '--window-size=420,900'],
  });
  const playerCtx = await playerBrowser.newContext({ viewport: { width: 390, height: 844 } });
  const playerPage = await playerCtx.newPage();

  // ─── Host creates game ─────────────────────────────────
  log('📺 Host: Loading...');
  await hostPage.goto(`${BASE}/quiz/host`);
  await sleep(2000);
  await screenshot(hostPage, '00-host-setup');

  await hostPage.evaluate(({ q, t }) => {
    document.getElementById('cfg-count').value = q;
    document.getElementById('cfg-timer').value = t;
    document.getElementById('cfg-source').value = 'mixed';
    document.getElementById('cfg-type').value = 'mixed';
  }, { q: String(QUESTIONS), t: String(TIMER) });
  await sleep(300);
  await hostPage.click('#btn-create');

  // Wait for preparation
  log('📺 Preparing songs...');
  await screenshot(hostPage, '01-host-preparing');

  await hostPage.waitForFunction(() => {
    const body = document.body.innerHTML;
    return /[A-Z0-9]{6}/.test(body) && body.includes('Start Quiz');
  }, { timeout: 180000 }); // 3 min timeout
  await sleep(1000);

  const joinCode = await hostPage.evaluate(() => {
    const el = document.querySelector('.join-code');
    return el?.textContent?.trim() || '';
  });
  log(`📺 Join code: ${joinCode}`);
  await screenshot(hostPage, '02-host-lobby');

  if (!joinCode) { log('❌ No join code'); process.exit(1); }

  // ─── Player joins ──────────────────────────────────────
  log('🎵 Player joining...');
  await playerPage.goto(`${BASE}/quiz/play?code=${joinCode}`);
  await sleep(1000);
  await playerPage.fill('#join-name', 'Christian');
  await playerPage.click('.avatar-btn:nth-child(1)');
  await sleep(200);
  await playerPage.click('#btn-join');
  await sleep(1500);
  await screenshot(playerPage, '03-player-joined');
  await screenshot(hostPage, '03-host-player-joined');

  // ─── Start quiz ────────────────────────────────────────
  log('📺 Starting quiz!');
  await hostPage.waitForFunction(() => {
    const btn = document.getElementById('btn-start');
    return btn && !btn.disabled;
  }, { timeout: 10000 });
  await hostPage.click('#btn-start');
  await sleep(1000);

  // ─── Play questions ────────────────────────────────────
  for (let q = 1; q <= QUESTIONS; q++) {
    log(`\n🎵 Q${q}/${QUESTIONS} — waiting for question...`);

    // Wait for question to appear on player
    try {
      await playerPage.waitForSelector('.mc-btn:not(:disabled), #ft-input', { timeout: 45000 });
    } catch {
      log(`   ⚠️ Question ${q} didn't appear`);
      await screenshot(hostPage, `Q${q}-host-timeout`);
      await screenshot(playerPage, `Q${q}-player-timeout`);
      break;
    }
    await sleep(500);

    // Screenshot question on both screens
    await screenshot(hostPage, `Q${q}-host-question`);
    await screenshot(playerPage, `Q${q}-player-question`);

    // Read question details from player
    const qInfo = await playerPage.evaluate(() => {
      const type = document.getElementById('mc-type')?.textContent || '';
      const btns = [...document.querySelectorAll('.mc-btn')].map(b => b.textContent);
      return { type, options: btns };
    });
    log(`   Type: ${qInfo.type}`);
    log(`   Options: ${qInfo.options.join(' | ')}`);

    // Player answers (random)
    await sleep(500 + Math.random() * 2000);
    try {
      const btns = await playerPage.$$('.mc-btn:not(:disabled)');
      if (btns.length > 0) {
        const idx = Math.floor(Math.random() * btns.length);
        await btns[idx].click();
        log(`   Answered: option ${idx + 1} (${qInfo.options[idx]})`);
      } else {
        await playerPage.fill('#ft-input', `test answer ${q}`);
        await playerPage.click('#ft-submit-btn');
        log(`   Answered: free text`);
      }
    } catch (e) {
      log(`   ⚠️ Answer failed: ${e.message}`);
    }

    // Wait for result on player
    await sleep(1000);
    try {
      await playerPage.waitForSelector('.result-container', { timeout: 20000 });
      await sleep(500);
    } catch {}

    // Screenshot result
    await screenshot(hostPage, `Q${q}-host-reveal`);
    await screenshot(playerPage, `Q${q}-player-result`);

    // Read result
    const result = await playerPage.evaluate(() => {
      const container = document.querySelector('.result-container');
      return {
        correct: container?.classList.contains('result-correct') || false,
        answer: document.querySelector('.result-answer')?.textContent || '',
        points: document.querySelector('.result-points')?.textContent || '',
      };
    });
    log(`   Result: ${result.correct ? '✅' : '❌'} ${result.answer} ${result.points}`);

    // Wait for scoreboard + next question
    if (q < QUESTIONS) {
      try {
        await playerPage.waitForFunction((qNum) => {
          // Wait for next question or scoreboard
          const mcType = document.getElementById('mc-type');
          const screen = document.querySelector('.screen.active');
          return screen?.id === 'screen-mc' || screen?.id === 'screen-ft';
        }, q, { timeout: 40000 });
      } catch {
        log(`   ⚠️ Timeout waiting for Q${q + 1}`);
      }
    }
  }

  // ─── Final results ─────────────────────────────────────
  log('\n🏆 Waiting for final results...');
  try {
    await hostPage.waitForFunction(() => {
      return document.body.innerHTML.includes('Quiz Complete') ||
             document.body.innerHTML.includes('DJ Mode');
    }, { timeout: 30000 });
  } catch {}
  await sleep(2000);
  await screenshot(hostPage, 'final-host-podium');
  await screenshot(playerPage, 'final-player-result');

  // ─── Fetch server logs ─────────────────────────────────
  log('\n📋 Fetching server logs...');
  try {
    const playLog = await (await fetch(`${BASE}/quiz/api/admin/play-log`)).json();
    const trackLog = await (await fetch(`${BASE}/quiz/api/admin/track-log`)).json();
    writeFileSync(`${outDir}/play-log.json`, JSON.stringify(playLog, null, 2));
    writeFileSync(`${outDir}/track-log.json`, JSON.stringify(trackLog, null, 2));
    log(`   Play log: ${playLog.length} entries`);
    log(`   Track log: ${trackLog.length} entries`);
  } catch (e) {
    log(`   ⚠️ Log fetch failed: ${e.message}`);
  }

  // Save test log
  writeFileSync(`${outDir}/test-log.json`, JSON.stringify(testLog, null, 2));
  log(`\n✅ Test complete! Screenshots: ${outDir}`);

  await sleep(3000);
  await hostPage.close();
  await playerPage.close();
  await browser.close();
  await playerBrowser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
