/**
 * E2E Observer — Watches host screen and takes screenshots automatically
 *
 * Run this alongside a manual quiz test. It watches the host page
 * and captures screenshots at every state change (question, reveal, scoreboard, final).
 *
 * Usage: node scripts/e2e-observer.js
 *
 * Then run your quiz manually — screenshots are saved automatically.
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = `recordings/observe-${timestamp}`;
mkdirSync(outDir, { recursive: true });

const testLog = [];
function log(msg) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${msg}`);
  testLog.push({ ts, msg });
}

async function main() {
  log(`📸 Observer started — watching ${BASE}/quiz/host`);
  log(`📁 Output: ${outDir}\n`);

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/quiz/host`);

  let lastState = '';
  let lastQuestion = 0;
  let shotCount = 0;

  async function capture(label) {
    shotCount++;
    const name = `${String(shotCount).padStart(3, '0')}-${label}`;
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
    log(`📸 ${name}`);
  }

  // Poll for state changes
  const interval = setInterval(async () => {
    try {
      const info = await page.evaluate(() => {
        // Detect which screen is visible
        const screens = document.querySelectorAll('.screen');
        let activeScreen = '';
        for (const s of screens) {
          if (s.classList.contains('active') || s.style.display === 'flex' || s.style.display === 'block') {
            activeScreen = s.id || '';
            break;
          }
        }

        // Get question number
        const qNum = document.getElementById('q-number')?.textContent || '';
        const qType = document.getElementById('q-type')?.textContent || '';

        // Get reveal info
        const revealSong = document.getElementById('reveal-song')?.textContent || '';
        const revealArtist = document.getElementById('reveal-artist')?.textContent || '';
        const funFact = document.getElementById('fun-fact')?.textContent || '';

        // Get player count
        const playerCount = document.getElementById('player-count')?.textContent || '0';

        // Check for final screen
        const isFinal = document.body.innerHTML.includes('Quiz Complete');
        const isDJ = document.body.innerHTML.includes('DJ Mode') && !document.body.innerHTML.includes('Quiz Complete');

        return { activeScreen, qNum, qType, revealSong, revealArtist, funFact, playerCount, isFinal, isDJ };
      });

      const stateKey = `${info.activeScreen}|${info.qNum}|${info.revealSong}`;

      if (stateKey !== lastState) {
        lastState = stateKey;

        // Determine what happened
        if (info.activeScreen.includes('countdown') || info.qType) {
          const qMatch = info.qNum.match(/(\d+)/);
          const qNum = qMatch ? parseInt(qMatch[1]) : 0;
          if (qNum > lastQuestion) {
            lastQuestion = qNum;
            await capture(`Q${qNum}-countdown-${info.qType.replace(/[^a-zA-Z]/g, '')}`);
          }
        }

        if (info.activeScreen.includes('question') || info.activeScreen.includes('playing')) {
          await capture(`Q${lastQuestion}-question`);
        }

        if (info.activeScreen.includes('reveal') && info.revealSong) {
          await capture(`Q${lastQuestion}-reveal-${info.revealSong.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}`);
          if (info.funFact) {
            log(`   💡 ${info.funFact.slice(0, 80)}`);
          }
          log(`   🎵 ${info.revealSong} — ${info.revealArtist}`);
        }

        if (info.activeScreen.includes('scoreboard')) {
          await capture(`Q${lastQuestion}-scoreboard`);
        }

        if (info.isFinal) {
          await capture('final-podium');
        }

        if (info.isDJ) {
          await capture('dj-mode');
        }

        // Player joined
        if (info.playerCount !== '0' && info.activeScreen.includes('lobby')) {
          await capture(`lobby-${info.playerCount}-players`);
        }
      }
    } catch {}
  }, 500); // Check every 500ms

  // Keep running until Ctrl+C
  log('👀 Watching for state changes... (Ctrl+C to stop)\n');

  process.on('SIGINT', async () => {
    clearInterval(interval);
    log('\n📋 Fetching server logs...');
    try {
      const playLog = await (await fetch(`${BASE}/quiz/api/admin/play-log`)).json();
      const trackLog = await (await fetch(`${BASE}/quiz/api/admin/track-log`)).json();
      writeFileSync(`${outDir}/play-log.json`, JSON.stringify(playLog, null, 2));
      writeFileSync(`${outDir}/track-log.json`, JSON.stringify(trackLog, null, 2));
      log(`   Play log: ${playLog.length} entries`);
      log(`   Track log: ${trackLog.length} entries`);
    } catch {}

    writeFileSync(`${outDir}/test-log.json`, JSON.stringify(testLog, null, 2));
    log(`\n✅ Observer done! ${shotCount} screenshots in ${outDir}`);
    await browser.close();
    process.exit(0);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
