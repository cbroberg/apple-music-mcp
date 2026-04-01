/**
 * E2E Visual Quiz Test — Playwright
 *
 * 4 separate browser windows on 3440x1440 ultrawide:
 *   Left half:  Host (1720px)
 *   Right half: Christian, Sanne, Mikkel (573px each)
 *
 * Usage: node scripts/e2e-quiz-visual.js
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const QUESTIONS = 5;
const TIMER = 15;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function launchWindow(x, y, w, h) {
  const browser = await chromium.launch({
    headless: false,
    args: [`--window-position=${x},${y}`, `--window-size=${w},${h}`],
  });
  const ctx = await browser.newContext({ viewport: { width: w - 16, height: h - 80 } });
  const page = await ctx.newPage();
  return { browser, page };
}

async function main() {
  console.log('\n🎮 E2E Quiz Test — 3 players on 3440x1440\n');

  // Layout: Host 1720px left, 3 players 573px each right
  const H = 1380;
  const hostW = 1720;
  const playerW = 573;

  const host = await launchWindow(0, 25, hostW, H);
  const p1 = await launchWindow(hostW, 25, playerW, H);
  const p2 = await launchWindow(hostW + playerW, 25, playerW, H);
  const p3 = await launchWindow(hostW + playerW * 2, 25, playerW, H);

  const players = [p1.page, p2.page, p3.page];
  const names = ['Christian', 'Nina', 'Viola'];
  const avatarIdx = [0, 1, 2];
  const djSearches = ['Fleetwood Mac', 'Stevie Wonder', 'Led Zeppelin'];

  // ─── Host creates game ─────────────────────────────────
  console.log('📺 Host: Creating game...');
  await host.page.goto(`${BASE}/quiz/host`);
  await sleep(2000);
  // Set values via JS (inputs may be inside custom select wrappers)
  await host.page.evaluate(({ q, t }) => {
    document.getElementById('cfg-count').value = q;
    document.getElementById('cfg-timer').value = t;
    document.getElementById('cfg-source').value = 'charts';
  }, { q: String(QUESTIONS), t: String(TIMER) });
  await sleep(300);
  await host.page.click('#btn-create');

  // Wait for join code to appear anywhere on the page
  await host.page.waitForFunction(() => {
    const body = document.body.innerHTML;
    return /[A-Z0-9]{6}/.test(body) && body.includes('Start Quiz');
  }, { timeout: 45000 });
  await sleep(1500);

  const joinCode = await host.page.evaluate(() => {
    // Find 6-char code in lobby view or join-code elements
    const body = document.body.innerHTML;
    const match = body.match(/class="join-code"[^>]*>([A-Z0-9]{6})/);
    if (match) return match[1];
    // Fallback: find any 6-char uppercase+digit sequence near "Start Quiz"
    const all = body.match(/[A-Z0-9]{6}/g) || [];
    return all.find(c => /[A-Z]/.test(c) && /[0-9]/.test(c)) || '';
  });
  console.log(`📺 Join code: ${joinCode}\n`);

  if (!joinCode) { console.error('❌ No join code'); process.exit(1); }

  // ─── Players join ──────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    console.log(`🎵 ${names[i]} joining...`);
    await players[i].goto(`${BASE}/quiz/play?code=${joinCode}`);
    await sleep(500);
    await players[i].fill('#join-name', names[i]);
    await players[i].click(`.avatar-btn:nth-child(${avatarIdx[i] + 1})`);
    await sleep(200);
    await players[i].click('#btn-join');
    await sleep(800);
  }
  console.log('');

  // ─── Start quiz ────────────────────────────────────────
  console.log('📺 Starting quiz!\n');
  // Wait for Start Quiz button to be enabled
  await host.page.waitForFunction(() => {
    const btn = document.getElementById('btn-start');
    return btn && !btn.disabled;
  }, { timeout: 15000 });
  await sleep(500);
  await host.page.click('#btn-start');

  // ─── Play questions ────────────────────────────────────
  for (let q = 1; q <= QUESTIONS; q++) {
    console.log(`🎵 Q${q}/${QUESTIONS}`);
    await sleep(4500); // countdown + question appears

    for (let i = 0; i < 3; i++) {
      await sleep(300 + Math.random() * 1500);
      try {
        const btns = await players[i].$$('.mc-btn:not(:disabled)');
        if (btns.length > 0) {
          const idx = Math.floor(Math.random() * btns.length);
          await btns[idx].click();
          console.log(`   ${names[i]} → option ${idx + 1}`);
        } else {
          try {
            await players[i].fill('#ft-input', `answer ${q}`);
            await players[i].click('#ft-submit-btn');
            console.log(`   ${names[i]} → text`);
          } catch {}
        }
      } catch {}
    }

    // Wait for reveal (6s) + scoreboard (5s) + countdown (3s) + buffer
    await sleep(16000);
  }

  // ─── Final results ─────────────────────────────────────
  console.log('\n🏆 Quiz complete!\n');
  await sleep(3000);

  // ─── DJ Mode ───────────────────────────────────────────
  console.log('🎧 Activating DJ Mode...');
  await host.page.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent.includes('DJ Mode')) { btn.click(); return; }
    }
  });
  await sleep(2000);

  for (let i = 0; i < 3; i++) {
    console.log(`🎵 ${names[i]} searching "${djSearches[i]}"...`);
    try {
      await players[i].fill('#dj-search', djSearches[i]);
      await sleep(2000);

      for (let s = 0; s < 6; s++) {
        const btns = await players[i].$$('.dj-add-btn:not(.used)');
        if (btns.length === 0) break;
        await btns[0].click();
        console.log(`   ${names[i]} added song ${s + 1}`);
        await sleep(300);
      }
    } catch (e) {
      console.log(`   ${names[i]} error: ${e.message}`);
    }
    await sleep(500);
  }

  console.log('\n✅ Done! Browsers stay open. Ctrl+C to close.\n');
  await new Promise(() => {});
}

main().catch(err => {
  console.error('💥', err);
  process.exit(1);
});
