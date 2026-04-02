/**
 * E2E Full Flow Test — Party Session with two rounds
 *
 * One Party, one join code for the entire evening.
 * Round 1: Jazz, 3 questions, Christian + Nina. Viola arrives late → Waiting Room.
 * DJ Mode (playlist state): Christian + Nina add songs.
 * Round 2: Host clicks New Round → Viola auto-joins lobby. Jazz, 3 questions, all 3 play.
 * DJ Mode (playlist state): All 3 add songs. Done.
 *
 * Usage: node scripts/e2e-full-flow.js
 */

import { chromium } from 'playwright';
import { execSync, spawn } from 'node:child_process';

const BASE = 'http://localhost:3000';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let screenRecordProc = null;
function startScreenRecording() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outFile = `recordings/full-flow-${ts}.mov`;
  execSync('mkdir -p recordings');
  const recorder = new URL('../scripts/screen-record/.build/release/screen-record', import.meta.url).pathname;
  console.log(`🎬 Recording → ${outFile}`);
  screenRecordProc = spawn(recorder, [outFile, '--crop'], { stdio: 'ignore' });
  return outFile;
}
async function stopScreenRecording() {
  if (screenRecordProc) {
    console.log('🎬 Stopping recording...');
    const proc = screenRecordProc;
    screenRecordProc = null;
    try { proc.kill('SIGINT'); } catch {}
    await new Promise(resolve => { proc.on('exit', resolve); setTimeout(resolve, 5000); });
    console.log('🎬 Saved.');
  }
}

async function launchWindow(x, y, w, h) {
  const browser = await chromium.launch({
    headless: false,
    args: [`--window-position=${x},${y}`, `--window-size=${w},${h}`],
  });
  const ctx = await browser.newContext({ viewport: { width: w - 16, height: h - 80 } });
  const page = await ctx.newPage();
  return { browser, page };
}

async function waitForSelector(page, sel, timeout = 15000) {
  try { await page.waitForSelector(sel, { timeout }); return true; }
  catch { return false; }
}

async function clickButton(page, text, timeout = 10000) {
  try {
    await page.waitForFunction((t) => {
      return [...document.querySelectorAll('button')].some(b => b.textContent.includes(t) && !b.disabled);
    }, text, { timeout });
    await page.evaluate((t) => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent.includes(t) && !btn.disabled) { btn.click(); return; }
      }
    }, text);
    return true;
  } catch { return false; }
}

async function answerQuestion(players, names) {
  for (let i = 0; i < players.length; i++) {
    await sleep(200 + Math.random() * 800);
    try {
      const btns = await players[i].$$('.mc-btn:not(:disabled)');
      if (btns.length > 0) {
        const idx = Math.floor(Math.random() * btns.length);
        await btns[idx].click();
        console.log(`   ${names[i]} → option ${idx + 1}`);
      } else {
        try {
          await players[i].fill('#ft-input', 'answer');
          await players[i].click('#ft-submit-btn');
          console.log(`   ${names[i]} → text`);
        } catch {}
      }
    } catch {}
  }
}

async function djAddSongs(page, name, searchTerm, maxSongs = 3) {
  try {
    // Wait for DJ screen to actually be active (not just in DOM)
    const djActive = await page.waitForFunction(() => {
      const screen = document.getElementById('screen-dj');
      return screen && screen.classList.contains('active');
    }, undefined, { timeout: 15000 }).then(() => true).catch(() => false);

    if (!djActive) {
      console.log(`   ${name}: DJ screen not active, skipping`);
      return;
    }

    // Check if search is available (hidden when 0 picks)
    const canSearch = await page.evaluate(() => {
      const panel = document.getElementById('dj-panel-search');
      const input = document.getElementById('dj-search');
      return panel && panel.style.display !== 'none' && input && !input.disabled;
    });
    if (!canSearch) {
      console.log(`   ${name}: no picks / search hidden, skipping`);
      return;
    }
    await page.evaluate(() => {
      const tab = document.getElementById('dj-tab-search');
      if (tab) tab.click();
    });
    await sleep(300);
    await page.fill('#dj-search', searchTerm);
    await sleep(2500);
    for (let s = 0; s < maxSongs; s++) {
      const btns = await page.$$('.dj-add-btn:not(.used)');
      if (btns.length === 0) break;
      await btns[0].click();
      console.log(`   ${name} added song ${s + 1}`);
      await sleep(400);
    }
  } catch (e) {
    console.log(`   ${name} DJ error: ${e.message}`);
  }
}

async function main() {
  console.log('\n🎮 E2E Full Flow — 2 rounds, Waiting Room, DJ Mode\n');

  // Minimize
  try { execSync(`osascript -e 'tell application "System Events" to set miniaturized of every window of every application process whose visible is true to true'`); } catch {}
  await sleep(500);

  const H = 1380;
  const hostW = 1720;
  const playerW = 573;

  const host = await launchWindow(0, 25, hostW, H);
  const p1 = await launchWindow(hostW, 25, playerW, H);
  const p2 = await launchWindow(hostW + playerW, 25, playerW, H);
  const p3 = await launchWindow(hostW + playerW * 2, 25, playerW, H);

  try { execSync(`osascript -e 'tell application "System Events" to tell application process "Ghostty" to set miniaturized of every window to true'`); } catch {}

  await host.page.goto(`${BASE}/quiz/host`);
  await sleep(2000);
  const recordingFile = startScreenRecording();
  await sleep(500);

  // ═══════════════════════════════════════════════════════
  // ROUND 1: Jazz, 3 questions, Christian + Nina
  // ═══════════════════════════════════════════════════════
  console.log('═══ ROUND 1: Jazz, Christian + Nina ═══\n');

  // Set config
  await host.page.evaluate(() => {
    document.getElementById('cfg-count').value = '3';
    document.getElementById('cfg-source').value = 'genre';
    document.getElementById('cfg-genre').value = 'Jazz';
    const skipRecent = document.getElementById('cfg-exclude-recent');
    if (skipRecent) skipRecent.checked = false;
  });
  await sleep(500);
  // Click Create Game
  await host.page.evaluate(() => {
    document.getElementById('btn-create').click();
  });
  console.log('📺 Creating quiz (Jazz, 3 questions)...');

  // Wait for lobby with join code
  await host.page.waitForFunction(() => {
    const m = document.body.innerHTML.match(/class="join-code"[^>]*>([A-Z0-9]{6})/);
    return m && document.body.innerHTML.includes('Start Quiz');
  }, undefined, { timeout: 180000 });
  await sleep(1000);

  const joinCode1 = await host.page.evaluate(() => {
    const m = document.body.innerHTML.match(/class="join-code"[^>]*>([A-Z0-9]{6})/);
    return m ? m[1] : '';
  });
  if (!joinCode1) { console.error('❌ No join code'); process.exit(1); }
  console.log(`📺 Join code: ${joinCode1}`);

  // Christian + Nina join
  const names12 = ['Christian', 'Nina'];
  for (let i = 0; i < 2; i++) {
    await [p1.page, p2.page][i].goto(`${BASE}/quiz/play?code=${joinCode1}`);
    await sleep(500);
    await [p1.page, p2.page][i].fill('#join-name', names12[i]);
    await [p1.page, p2.page][i].click(`.avatar-btn:nth-child(${i + 1})`);
    await sleep(200);
    await [p1.page, p2.page][i].click('#btn-join');
    console.log(`🎵 ${names12[i]} joined`);
    await sleep(500);
  }

  // Viola tries to join late (goes to Waiting Room after quiz starts)
  // First start quiz
  await host.page.waitForFunction(() => {
    const btn = document.getElementById('btn-start');
    return btn && !btn.disabled;
  }, undefined, { timeout: 10000 });
  await sleep(500);
  await host.page.click('#btn-start');
  console.log('📺 Quiz started!\n');

  // Viola joins during quiz → Waiting Room
  await sleep(3000);
  await p3.page.goto(`${BASE}/quiz/play?code=${joinCode1}`);
  await sleep(500);
  await p3.page.fill('#join-name', 'Viola');
  await p3.page.click('.avatar-btn:nth-child(3)');
  await sleep(200);
  await p3.page.click('#btn-join');
  console.log('🎵 Viola → Waiting Room\n');

  // Play 3 questions
  for (let q = 1; q <= 3; q++) {
    console.log(`🎵 Q${q}/3`);
    if (await waitForSelector(p1.page, '.mc-btn:not(:disabled), #ft-input', 45000)) {
      await sleep(300);
      await answerQuestion([p1.page, p2.page], names12);
    }
    // Wait for next question or final
    if (q < 3) {
      try {
        await host.page.waitForFunction((qn) => {
          const el = document.getElementById('q-number');
          return el && !el.textContent.includes(`Question ${qn} `);
        }, q, { timeout: 40000 });
      } catch {}
    } else {
      try {
        await host.page.waitForFunction(() => {
          return document.body.innerHTML.includes('Quiz Complete') || document.body.innerHTML.includes('DJ Mode');
        }, undefined, { timeout: 40000 });
      } catch {}
    }
  }

  console.log('\n🏆 Round 1 complete!\n');

  // Wait for final screen to be active (finished state) — not just text matching
  try {
    await host.page.waitForFunction(() => {
      return document.getElementById('screen-final')?.classList.contains('active');
    }, undefined, { timeout: 40000 });
    console.log('📺 Final screen active');
  } catch { console.log('⚠️ Final screen timeout'); }
  await sleep(5000);

  // Activate DJ Mode — diagnose WS state, then send directly
  console.log('🎧 Activating DJ Mode...');
  const djDiag = await host.page.evaluate(() => {
    const wsState = ws ? ws.readyState : -1; // 0=CONNECTING,1=OPEN,2=CLOSING,3=CLOSED
    const gameState = currentGameState;
    const activeScreen = [...document.querySelectorAll('.screen.active')].map(s => s.id).join(', ');
    // Send activate_dj directly via WS
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'activate_dj' }));
      return { sent: true, wsState, gameState, activeScreen };
    }
    return { sent: false, wsState, gameState, activeScreen };
  });
  console.log(`   WS state: ${djDiag.wsState}, gameState: ${djDiag.gameState}, screen: ${djDiag.activeScreen}, sent: ${djDiag.sent}`);
  await sleep(4000);

  // Check host DJ screen
  const hostDjOk = await host.page.evaluate(() => {
    const active = document.getElementById('screen-dj')?.classList.contains('active');
    const gameState = currentGameState;
    return { active, gameState };
  });
  console.log(`   Host DJ screen active: ${hostDjOk.active}, gameState: ${hostDjOk.gameState}`);

  // If host DJ still not active, try clicking the button as fallback
  if (!hostDjOk.active) {
    console.log('   ⚠️ Retrying via button click...');
    await host.page.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if (btn.textContent.includes('DJ Mode') && !btn.disabled) { btn.click(); break; }
      }
    });
    await sleep(3000);
  }

  // Wait for DJ screen on players
  for (const [i, p] of [p1.page, p2.page].entries()) {
    const active = await p.waitForFunction(() => {
      const s = document.getElementById('screen-dj');
      return s && s.classList.contains('active');
    }, undefined, { timeout: 15000 }).then(() => true).catch(() => false);
    console.log(`   ${names12[i]} DJ screen active: ${active}`);
    if (!active) {
      const info = await p.evaluate(() => {
        const screens = [...document.querySelectorAll('.screen.active')].map(s => s.id).join(', ');
        const wsOk = ws && ws.readyState === WebSocket.OPEN;
        return { screens, wsOk };
      });
      console.log(`   ${names12[i]} screen: ${info.screens}, ws: ${info.wsOk}`);
    }
  }
  await sleep(500);

  // Christian + Nina add songs
  console.log('🎵 Christian searching "John Coltrane"...');
  await djAddSongs(p1.page, 'Christian', 'John Coltrane');
  await sleep(500);
  console.log('🎵 Nina searching "Miles Davis"...');
  await djAddSongs(p2.page, 'Nina', 'Miles Davis');
  await sleep(2000);

  // ═══════════════════════════════════════════════════════
  // ROUND 2: New Quiz, Viola joins from Waiting Room
  // ═══════════════════════════════════════════════════════
  console.log('\n═══ ROUND 2: New Round (same Party), Viola auto-joins ═══\n');

  // Host clicks New Round
  console.log('📺 Host clicks New Round...');
  const newRoundClicked = await host.page.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent.includes('New Round')) { btn.click(); return true; }
    }
    // Fallback: try legacy name or function directly
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent.includes('New Quiz')) { btn.click(); return true; }
    }
    if (typeof startNewRound === 'function') { startNewRound(); return true; }
    return false;
  });
  console.log(`   New Round clicked: ${newRoundClicked}`);
  await sleep(2000);

  // Click Create Game
  await host.page.evaluate(() => {
    const btn = document.getElementById('btn-create');
    if (btn) btn.click();
  });
  console.log('📺 Creating round 2...');

  // Wait for lobby with join code
  await host.page.waitForFunction(() => {
    const m = document.body.innerHTML.match(/class="join-code"[^>]*>([A-Z0-9]{6})/);
    return m && document.body.innerHTML.includes('Start Quiz');
  }, undefined, { timeout: 180000 });
  await sleep(1000);

  const joinCode2 = await host.page.evaluate(() => {
    const m = document.body.innerHTML.match(/class="join-code"[^>]*>([A-Z0-9]{6})/);
    return m ? m[1] : '';
  });
  if (!joinCode2) { console.error('❌ No join code round 2'); process.exit(1); }
  console.log(`📺 Join code: ${joinCode2}`);
  if (joinCode2 === joinCode1) {
    console.log('✓ Same join code across rounds (Party!)');
  } else {
    console.log(`⚠️ Different join codes: R1=${joinCode1} R2=${joinCode2}`);
  }

  // All players should auto-join via lobby_open message — wait for them on host
  console.log('⏳ Waiting for all 3 players to auto-join...');
  try {
    await host.page.waitForFunction(() => {
      const body = document.body.innerHTML;
      return body.includes('Christian') && body.includes('Nina') && body.includes('Viola');
    }, undefined, { timeout: 30000 });
    console.log('🎵 All 3 players auto-joined! ✓');
  } catch {
    console.log('⚠️ Not all players auto-joined — checking who made it');
    for (const name of ['Christian', 'Nina', 'Viola']) {
      const joined = await host.page.evaluate((n) => document.body.innerHTML.includes(n), name);
      console.log(`   ${name}: ${joined ? '✓' : '✗'}`);
    }
  }

  // Start quiz
  await host.page.waitForFunction(() => {
    const btn = document.getElementById('btn-start');
    return btn && !btn.disabled;
  }, undefined, { timeout: 15000 });
  await sleep(500);
  await host.page.click('#btn-start');
  console.log('📺 Round 2 started!\n');

  const allPlayers = [p1.page, p2.page, p3.page];
  const allNames = ['Christian', 'Nina', 'Viola'];

  // Play 3 questions
  for (let q = 1; q <= 3; q++) {
    console.log(`🎵 Q${q}/3`);
    if (await waitForSelector(p1.page, '.mc-btn:not(:disabled), #ft-input', 45000)) {
      await sleep(300);
      await answerQuestion(allPlayers, allNames);
    }
    if (q < 3) {
      try {
        await host.page.waitForFunction((qn) => {
          const el = document.getElementById('q-number');
          return el && !el.textContent.includes(`Question ${qn} `);
        }, q, { timeout: 40000 });
      } catch {}
    } else {
      try {
        await host.page.waitForFunction(() => {
          return document.body.innerHTML.includes('Quiz Complete') || document.body.innerHTML.includes('DJ Mode');
        }, undefined, { timeout: 40000 });
      } catch {}
    }
  }

  console.log('\n🏆 Round 2 complete!\n');

  // Wait for final screen
  try {
    await host.page.waitForFunction(() => {
      return document.getElementById('screen-final')?.classList.contains('active');
    }, undefined, { timeout: 40000 });
    console.log('📺 Final screen active');
  } catch { console.log('⚠️ Final screen timeout'); }
  await sleep(5000);

  console.log('🎧 Activating DJ Mode (round 2)...');
  const djClicked2 = await host.page.evaluate(() => {
    for (const btn of document.querySelectorAll('button')) {
      if (btn.textContent.includes('DJ Mode') && !btn.disabled) { btn.click(); return true; }
    }
    return false;
  });
  console.log(`   DJ Mode clicked: ${djClicked2}`);
  await sleep(3000);

  const hostDjOk2 = await host.page.evaluate(() => document.getElementById('screen-dj')?.classList.contains('active'));
  console.log(`   Host DJ screen active: ${hostDjOk2}`);

  for (const [i, p] of allPlayers.entries()) {
    const active = await p.waitForFunction(() => {
      const s = document.getElementById('screen-dj');
      return s && s.classList.contains('active');
    }, undefined, { timeout: 15000 }).then(() => true).catch(() => false);
    console.log(`   ${allNames[i]} DJ screen active: ${active}`);
  }
  await sleep(500);

  console.log('🎵 Christian searching "Dave Brubeck"...');
  await djAddSongs(p1.page, 'Christian', 'Dave Brubeck');
  await sleep(500);
  console.log('🎵 Nina searching "Ella Fitzgerald"...');
  await djAddSongs(p2.page, 'Nina', 'Ella Fitzgerald');
  await sleep(500);
  console.log('🎵 Viola searching "Chet Baker"...');
  await djAddSongs(p3.page, 'Viola', 'Chet Baker');
  await sleep(5000);

  // ═══════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════
  await stopScreenRecording();
  console.log(`\n✅ Full flow complete! Recording: ${recordingFile}`);
  console.log('🔒 Closing browsers...');
  for (const b of [host, p1, p2, p3]) {
    try { await b.browser.close(); } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', async () => { await stopScreenRecording(); process.exit(0); });
process.on('SIGTERM', async () => { await stopScreenRecording(); process.exit(0); });

main().catch(err => {
  console.error('💥', err);
  stopScreenRecording();
  process.exit(1);
});
