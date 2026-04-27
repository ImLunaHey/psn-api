import { PSN } from '../src';

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} (your sony.com NPSSO cookie value)`);
  return v;
};

const psn = new PSN({ npsso: requireEnv('NPSSO') });
const me = await psn.users.me();

const titles = await me.trophies.titles({ limit: 5 });
const recent = titles[0];
if (!recent) {
  console.log('No trophy titles yet — go play a game!');
  process.exit(0);
}

console.log(`${recent.name} (${recent.platform})`);

const summary = await recent.summary();
console.log(
  `Progress: ${summary.earnedCount}/${summary.totalCount} (${summary.progress}%)`,
);

const trophies = await recent.earned();
const earned = trophies.filter((t) => t.earned);
console.log(`Earned ${earned.length} of ${trophies.length}:`);

for (const t of earned.slice(0, 10)) {
  const when = t.earnedAt ? ` — ${t.earnedAt}` : '';
  console.log(`  [${t.type.padEnd(8)}] ${t.name}${when}`);
}
