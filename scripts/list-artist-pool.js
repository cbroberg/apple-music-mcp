#!/usr/bin/env node
/**
 * Generate a readable text list from artist-pool.json
 * Usage: node scripts/list-artist-pool.js > artist-pool.txt
 */
import { readFileSync } from 'node:fs';
const pool = JSON.parse(readFileSync('data/artist-pool.json', 'utf-8'));

// Dedup
const seen = new Set();
const unique = pool.filter(a => {
  if (seen.has(a.name)) return false;
  seen.add(a.name);
  return true;
});

// Group by country
const byCountry = {};
for (const a of unique) {
  const c = a.country || 'Unknown';
  if (!byCountry[c]) byCountry[c] = [];
  byCountry[c].push(a);
}

console.log(`Artist Pool — ${unique.length} artists\n`);
console.log('='.repeat(60) + '\n');

for (const [country, artists] of Object.entries(byCountry).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`${country} (${artists.length})`);
  console.log('-'.repeat(40));
  for (const a of artists.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`  ${a.name} — ${a.genres.join(', ')} (${a.decade})`);
  }
  console.log('');
}
