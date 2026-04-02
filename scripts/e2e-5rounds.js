/**
 * E2E 5 Rounds Test — Party Session with accumulated playlist
 *
 * One Party, 5 rounds, 3 players (Viola arrives late in R1).
 * After each round: DJ Mode → players add songs → New Round.
 * After round 5: Print accumulated playlist.
 *
 * MUTE_ALL=true → no music playback, no sound effects.
 *
 * Usage: node scripts/e2e-5rounds.js
 */

import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const ROUNDS = 5;
const QUESTIONS_PER_ROUND = 3;

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

async function answerQuestion(players, names) {
  for (let i = 0; i < players.length; i++) {
    await sleep(100 + Math.random() * 300);
    try {
      const btns = await players[i].$$('.mc-btn:not(:disabled)');
      if (btns.length > 0) {
        const idx = Math.floor(Math.random() * btns.length);
        await btns[idx].click();
      } else {
        try {
          await players[i].fill('#ft-input', 'answer');
          await players[i].click('#ft-submit-btn');
        } catch {}
      }
    } catch {}
  }
}

async function djAddSongs(page, name, searchTerm, maxSongs = 2) {
  try {
    const djActive = await page.waitForFunction(() => {
      const screen = document.getElementById('screen-dj');
      return screen && screen.classList.contains('active');
    }, undefined, { timeout: 15000 }).then(() => true).catch(() => false);

    if (!djActive) {
      console.log(`   ${name}: DJ screen not active`);
      return 0;
    }

    const canSearch = await page.evaluate(() => {
      const panel = document.getElementById('dj-panel-search');
      const input = document.getElementById('dj-search');
      return panel && panel.style.display !== 'none' && input && !input.disabled;
    });
    if (!canSearch) {
      console.log(`   ${name}: 0 picks, skipping search`);
      return 0;
    }

    await page.evaluate(() => {
      const tab = document.getElementById('dj-tab-search');
      if (tab) tab.click();
    });
    await sleep(300);
    await page.fill('#dj-search', searchTerm);
    await sleep(2500);

    let added = 0;
    for (let s = 0; s < maxSongs; s++) {
      const btns = await page.$$('.dj-add-btn:not(.used)');
      if (btns.length === 0) break;
      await btns[0].click();
      added++;
      await sleep(300);
    }
    return added;
  } catch (e) {
    console.log(`   ${name} DJ error: ${e.message.split('\n')[0]}`);
    return 0;
  }
}

const SEARCH_TERMS = [
  ['Beatles', 'Queen', 'David Bowie'],
  ['Fleetwood Mac', 'Eagles', 'Elton John'],
  ['Prince', 'Michael Jackson', 'Stevie Wonder'],
  ['Led Zeppelin', 'Pink Floyd', 'Rolling Stones'],
  ['Radiohead', 'Nirvana', 'Oasis'],
];

async function main() {
  console.log(`\n🎮 E2E 5 Rounds — Party Session + Playlist Accumulation\n`);

  const H = 1380;
  const hostW = 1720;
  const playerW = 573;

  const host = await launchWindow(0, 25, hostW, H);
  const p1 = await launchWindow(hostW, 25, playerW, H);
  const p2 = await launchWindow(hostW + playerW, 25, playerW, H);
  const p3 = await launchWindow(hostW + playerW * 2, 25, playerW, H);

  await host.page.goto(`${BASE}/quiz/host`);
  await sleep(2000);

  let joinCode = '';
  const allAddedSongs = [];

  for (let round = 1; round <= ROUNDS; round++) {
    const isFirstRound = round === 1;
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ROUND ${round}/${ROUNDS}`);
    console.log(`${'═'.repeat(60)}\n`);

    // ─── Create Game ───
    if (!isFirstRound) {
      // New Round from DJ Mode
      await host.page.evaluate(() => {
        for (const btn of document.querySelectorAll('button')) {
          if (btn.textContent.includes('New Round') || btn.textContent.includes('New Quiz')) {
            btn.click(); return;
          }
        }
        if (typeof startNewRound === 'function') startNewRound();
      });
      await sleep(1000);
    }

    // Set config
    await host.page.evaluate((q) => {
      document.getElementById('cfg-count').value = String(q);
      document.getElementById('cfg-source').value = 'mixed';
      const skipRecent = document.getElementById('cfg-exclude-recent');
      if (skipRecent) skipRecent.checked = false;
    }, QUESTIONS_PER_ROUND);
    await sleep(300);

    await host.page.evaluate(() => {
      document.getElementById('btn-create').click();
    });
    console.log('📺 Creating quiz...');

    // Wait for lobby
    await host.page.waitForFunction(() => {
      const m = document.body.innerHTML.match(/class="join-code"[^>]*>([A-Z0-9]{6})/);
      return m && document.body.innerHTML.includes('Start Quiz');
    }, undefined, { timeout: 180000 });
    await sleep(1000);

    const code = await host.page.evaluate(() => {
      const m = document.body.innerHTML.match(/class="join-code"[^>]*>([A-Z0-9]{6})/);
      return m ? m[1] : '';
    });
    if (!code) { console.error('No join code!'); process.exit(1); }

    if (isFirstRound) {
      joinCode = code;
      console.log(`📺 Party join code: ${joinCode}`);
    } else {
      console.log(`📺 Join code: ${code} ${code === joinCode ? '(same ✓)' : '(DIFFERENT!)'}`);
    }

    // ─── Players Join (first round only) ───
    if (isFirstRound) {
      const names = ['Christian', 'Nina'];
      for (let i = 0; i < 2; i++) {
        await [p1.page, p2.page][i].goto(`${BASE}/quiz/play?code=${joinCode}`);
        await sleep(500);
        await [p1.page, p2.page][i].fill('#join-name', names[i]);
        await [p1.page, p2.page][i].click(`.avatar-btn:nth-child(${i + 1})`);
        await sleep(200);
        await [p1.page, p2.page][i].click('#btn-join');
        console.log(`🎵 ${names[i]} joined`);
        await sleep(500);
      }
    }

    // ─── Wait for players to auto-rejoin (rounds 2+) ───
    if (!isFirstRound) {
      try {
        await host.page.waitForFunction(() => {
          const body = document.body.innerHTML;
          return body.includes('Christian') && body.includes('Nina') && (round <= 2 || body.includes('Viola'));
        }, undefined, { timeout: 15000 });
        console.log('🎵 Players auto-joined ✓');
      } catch {
        console.log('⚠️ Not all players auto-joined');
      }
    }

    // ─── Start Quiz ───
    await host.page.waitForFunction(() => {
      const btn = document.getElementById('btn-start');
      return btn && !btn.disabled;
    }, undefined, { timeout: 15000 });
    await sleep(300);
    await host.page.click('#btn-start');
    console.log('📺 Quiz started');

    // Viola joins late in round 1
    if (isFirstRound) {
      await sleep(2000);
      await p3.page.goto(`${BASE}/quiz/play?code=${joinCode}`);
      await sleep(500);
      await p3.page.fill('#join-name', 'Viola');
      await p3.page.click('.avatar-btn:nth-child(3)');
      await sleep(200);
      await p3.page.click('#btn-join');
      console.log('🎵 Viola → Waiting Room');
    }

    // ─── Answer Questions ───
    const activePlayers = round === 1 ? [p1.page, p2.page] : [p1.page, p2.page, p3.page];
    const activeNames = round === 1 ? ['Christian', 'Nina'] : ['Christian', 'Nina', 'Viola'];

    for (let q = 1; q <= QUESTIONS_PER_ROUND; q++) {
      const found = await p1.page.waitForSelector('.mc-btn:not(:disabled), #ft-input', { timeout: 45000 }).then(() => true).catch(() => false);
      if (found) {
        await sleep(200);
        await answerQuestion(activePlayers, activeNames);
      }

      if (q < QUESTIONS_PER_ROUND) {
        try {
          await host.page.waitForFunction((qn) => {
            const el = document.getElementById('q-number');
            return el && !el.textContent.includes(`Question ${qn} `);
          }, q, { timeout: 40000 });
        } catch {}
      } else {
        try {
          await host.page.waitForFunction(() => {
            return document.getElementById('screen-final')?.classList.contains('active');
          }, undefined, { timeout: 40000 });
        } catch {}
      }
    }

    console.log(`🏆 Round ${round} complete`);

    // ─── Wait for Final Screen ───
    try {
      await host.page.waitForFunction(() => {
        return document.getElementById('screen-final')?.classList.contains('active');
      }, undefined, { timeout: 30000 });
    } catch { console.log('⚠️ Final screen timeout'); }
    await sleep(2000);

    // ─── Take screenshot of final results ───
    await host.page.screenshot({ path: `recordings/round-${round}-final.png` });
    console.log(`📸 Screenshot: recordings/round-${round}-final.png`);

    // ─── Activate DJ Mode ───
    console.log('🎧 Activating DJ Mode...');
    await host.page.evaluate(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'activate_dj' }));
      }
    });
    await sleep(3000);

    const hostDj = await host.page.evaluate(() => document.getElementById('screen-dj')?.classList.contains('active'));
    if (!hostDj) {
      console.log('⚠️ DJ Mode failed — retrying with button');
      await host.page.evaluate(() => {
        for (const btn of document.querySelectorAll('button')) {
          if (btn.textContent.includes('DJ Mode') && !btn.disabled) { btn.click(); break; }
        }
      });
      await sleep(3000);
    }

    // ─── DJ Mode: Add Songs ───
    const terms = SEARCH_TERMS[(round - 1) % SEARCH_TERMS.length];
    const djPlayers = round === 1 ? [p1.page, p2.page] : [p1.page, p2.page, p3.page];
    const djNames = round === 1 ? ['Christian', 'Nina'] : ['Christian', 'Nina', 'Viola'];

    for (let i = 0; i < djPlayers.length; i++) {
      const added = await djAddSongs(djPlayers[i], djNames[i], terms[i], 2);
      if (added > 0) {
        console.log(`   ${djNames[i]} added ${added} songs (${terms[i]})`);
        allAddedSongs.push({ round, player: djNames[i], search: terms[i], count: added });
      }
    }
    await sleep(1000);

    // ─── Take screenshot of DJ Mode ───
    await host.page.screenshot({ path: `recordings/round-${round}-dj.png` });
    console.log(`📸 Screenshot: recordings/round-${round}-dj.png`);
  }

  // ═══════════════════════════════════════════════════════
  // FINAL: Print accumulated playlist
  // ═══════════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  ACCUMULATED PLAYLIST');
  console.log(`${'═'.repeat(60)}\n`);

  // Get queue from host DJ screen
  const playlist = await host.page.evaluate(() => {
    const queue = document.querySelectorAll('#dj-host-queue > div');
    const songs = [];
    for (const row of queue) {
      const name = row.querySelector('div[style*="font-weight:600"]')?.textContent || '';
      const artist = row.querySelector('div[style*="font-size:13px"]')?.textContent || '';
      const addedBy = row.querySelector('div[style*="color:var(--dimmer)"]')?.textContent || '';
      if (name) songs.push({ name, artist, addedBy: addedBy.trim() });
    }
    // Also get current playing
    const npName = document.getElementById('dj-np-name')?.textContent;
    const npArtist = document.getElementById('dj-np-artist')?.textContent;
    const npWho = document.getElementById('dj-np-who')?.textContent;
    if (npName) songs.unshift({ name: npName, artist: npArtist || '', addedBy: (npWho || '').trim(), playing: true });
    return songs;
  });

  console.log(`Total songs in queue: ${playlist.length}\n`);
  for (let i = 0; i < playlist.length; i++) {
    const s = playlist[i];
    const prefix = s.playing ? '▶' : ' ';
    console.log(`${prefix} ${i + 1}. ${s.name} — ${s.artist} (${s.addedBy})`);
  }

  console.log(`\nSongs added per round:`);
  for (let r = 1; r <= ROUNDS; r++) {
    const roundSongs = allAddedSongs.filter(s => s.round === r);
    const total = roundSongs.reduce((sum, s) => sum + s.count, 0);
    console.log(`  Round ${r}: ${total} songs`);
  }

  // Take final screenshot
  await host.page.screenshot({ path: 'recordings/final-playlist.png' });
  console.log(`\n📸 Final screenshot: recordings/final-playlist.png`);

  // Save playlist to JSON
  const { writeFileSync, mkdirSync } = await import('node:fs');
  mkdirSync('recordings', { recursive: true });
  writeFileSync('recordings/playlist-5rounds.json', JSON.stringify({ playlist, addedSongs: allAddedSongs, rounds: ROUNDS }, null, 2));
  console.log('📝 Playlist saved: recordings/playlist-5rounds.json');

  console.log('\n✅ 5-round test complete!');
  console.log('🔒 Closing browsers...');
  for (const b of [host, p1, p2, p3]) {
    try { await b.browser.close(); } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

main().catch(err => {
  console.error('💥', err);
  process.exit(1);
});
