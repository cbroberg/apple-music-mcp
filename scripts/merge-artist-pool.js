#!/usr/bin/env node
/**
 * Merge all artist pool sources into one deduplicated artist-pool.json
 * Sources: artist-pool.json (original), artists-pool-additions.json (user), Danish research
 */
import { readFileSync, writeFileSync } from 'node:fs';

// Load sources
const original = JSON.parse(readFileSync('data/artist-pool.json', 'utf-8'));
const additions = JSON.parse(readFileSync('data/artists-pool-additions.json', 'utf-8'));

// Danish artists from agent research (not already in other sources)
const danishResearch = [
  {"name": "Gasolin'", "country": "Denmark", "genres": ["rock"], "decade": "1970s"},
  {"name": "Kim Larsen", "country": "Denmark", "genres": ["rock", "pop"], "decade": "1980s"},
  {"name": "TV-2", "country": "Denmark", "genres": ["pop", "rock"], "decade": "1980s"},
  {"name": "Lars H.U.G.", "country": "Denmark", "genres": ["new wave", "rock"], "decade": "1980s"},
  {"name": "Anne Linnet", "country": "Denmark", "genres": ["pop", "rock"], "decade": "1980s"},
  {"name": "Sanne Salomonsen", "country": "Denmark", "genres": ["pop", "rock"], "decade": "1980s"},
  {"name": "Thomas Helmig", "country": "Denmark", "genres": ["pop", "rock"], "decade": "1990s"},
  {"name": "D-A-D", "country": "Denmark", "genres": ["hard rock"], "decade": "1990s"},
  {"name": "Michael Learns to Rock", "country": "Denmark", "genres": ["pop", "soft rock"], "decade": "1990s"},
  {"name": "Kashmir", "country": "Denmark", "genres": ["alternative", "rock"], "decade": "2000s"},
  {"name": "The Raveonettes", "country": "Denmark", "genres": ["noise pop", "shoegaze"], "decade": "2000s"},
  {"name": "Saybia", "country": "Denmark", "genres": ["pop", "rock"], "decade": "2000s"},
  {"name": "Whigfield", "country": "Denmark", "genres": ["eurodance"], "decade": "1990s"},
  {"name": "Laid Back", "country": "Denmark", "genres": ["synth-pop", "reggae"], "decade": "1980s"},
  {"name": "Savage Rose", "country": "Denmark", "genres": ["psychedelic rock"], "decade": "1970s"},
  {"name": "Sort Sol", "country": "Denmark", "genres": ["post-punk", "gothic rock"], "decade": "1980s"},
  {"name": "Nik & Jay", "country": "Denmark", "genres": ["pop", "hip-hop"], "decade": "2000s"},
  {"name": "Ukendt Kunstner", "country": "Denmark", "genres": ["hip-hop"], "decade": "2010s"},
  {"name": "MC Einar", "country": "Denmark", "genres": ["hip-hop"], "decade": "1990s"},
  {"name": "Østkyst Hustlers", "country": "Denmark", "genres": ["hip-hop"], "decade": "1990s"},
  {"name": "Kesi", "country": "Denmark", "genres": ["hip-hop", "r&b"], "decade": "2020s"},
  {"name": "Gilli", "country": "Denmark", "genres": ["hip-hop", "afrobeats"], "decade": "2020s"},
  {"name": "Branco", "country": "Denmark", "genres": ["hip-hop"], "decade": "2020s"},
  {"name": "L.O.C.", "country": "Denmark", "genres": ["hip-hop"], "decade": "2000s"},
  {"name": "Kidd", "country": "Denmark", "genres": ["hip-hop"], "decade": "2020s"},
  {"name": "Sivas", "country": "Denmark", "genres": ["hip-hop"], "decade": "2010s"},
  {"name": "TopGunn", "country": "Denmark", "genres": ["hip-hop"], "decade": "2010s"},
  {"name": "Pede B", "country": "Denmark", "genres": ["hip-hop"], "decade": "2010s"},
  {"name": "Kölsch", "country": "Denmark", "genres": ["techno", "melodic house"], "decade": "2010s"},
  {"name": "WhoMadeWho", "country": "Denmark", "genres": ["electronic", "indie"], "decade": "2010s"},
  {"name": "Carpark North", "country": "Denmark", "genres": ["electronic", "rock"], "decade": "2000s"},
  {"name": "Christopher", "country": "Denmark", "genres": ["pop"], "decade": "2010s"},
  {"name": "Agnes Obel", "country": "Denmark", "genres": ["art pop", "chamber"], "decade": "2010s"},
  {"name": "Oh Land", "country": "Denmark", "genres": ["art pop", "electronic"], "decade": "2010s"},
  {"name": "Burhan G", "country": "Denmark", "genres": ["r&b", "pop"], "decade": "2000s"},
  {"name": "Rasmus Seebach", "country": "Denmark", "genres": ["pop"], "decade": "2010s"},
  {"name": "Tommy Seebach", "country": "Denmark", "genres": ["pop"], "decade": "1980s"},
  {"name": "Niels-Henning Ørsted Pedersen", "country": "Denmark", "genres": ["jazz"], "decade": "1980s"},
  {"name": "Palle Mikkelborg", "country": "Denmark", "genres": ["jazz"], "decade": "1990s"},
  {"name": "Niels Lan Doky", "country": "Denmark", "genres": ["jazz"], "decade": "1990s"},
  {"name": "Mercyful Fate", "country": "Denmark", "genres": ["heavy metal"], "decade": "1980s"},
  {"name": "King Diamond", "country": "Denmark", "genres": ["heavy metal"], "decade": "1980s"},
  {"name": "Pretty Maids", "country": "Denmark", "genres": ["hard rock", "metal"], "decade": "1980s"},
  {"name": "Sebastian", "country": "Denmark", "genres": ["pop", "viser"], "decade": "1970s"},
  {"name": "C.V. Jørgensen", "country": "Denmark", "genres": ["rock", "poet"], "decade": "1970s"},
  {"name": "Poul Krebs", "country": "Denmark", "genres": ["country", "rock"], "decade": "1990s"},
  {"name": "Johnny Madsen", "country": "Denmark", "genres": ["blues", "folk"], "decade": "1990s"},
  {"name": "Junior Senior", "country": "Denmark", "genres": ["pop", "dance-punk"], "decade": "2000s"},
  {"name": "Infernal", "country": "Denmark", "genres": ["dance", "pop"], "decade": "2000s"},
  {"name": "Aura Dione", "country": "Denmark", "genres": ["pop"], "decade": "2010s"},
];

// Merge all
const all = [...original, ...additions, ...danishResearch];

// Dedup by name (case-insensitive)
const seen = new Map();
for (const a of all) {
  const key = a.name.toLowerCase().trim();
  if (!seen.has(key)) {
    seen.set(key, a);
  } else {
    // Merge genres if the duplicate has different ones
    const existing = seen.get(key);
    const newGenres = new Set([...existing.genres, ...a.genres]);
    existing.genres = [...newGenres];
  }
}

const merged = [...seen.values()];

// Sort by country, then name
merged.sort((a, b) => {
  if (a.country !== b.country) return a.country.localeCompare(b.country);
  return a.name.localeCompare(b.name);
});

writeFileSync('data/artist-pool.json', JSON.stringify(merged, null, 2));

// Stats
const byCountry = {};
const byDecade = {};
const byGenre = {};
for (const a of merged) {
  byCountry[a.country] = (byCountry[a.country] || 0) + 1;
  byDecade[a.decade] = (byDecade[a.decade] || 0) + 1;
  for (const g of a.genres) byGenre[g] = (byGenre[g] || 0) + 1;
}

console.log(`\n✅ Merged artist pool: ${merged.length} unique artists\n`);
console.log('By country (top 15):');
for (const [c, n] of Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${c}: ${n}`);
}
console.log('\nBy decade:');
for (const [d, n] of Object.entries(byDecade).sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`  ${d}: ${n}`);
}
console.log('\nBy genre (top 20):');
for (const [g, n] of Object.entries(byGenre).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${g}: ${n}`);
}
