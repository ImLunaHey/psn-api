import { PSN } from '../src';

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} (your sony.com NPSSO cookie value)`);
  return v;
};

const psn = new PSN({ npsso: requireEnv('NPSSO') });
const me = await psn.users.me();

const games = await me.recentlyPlayed({ limit: 10 });
console.log(`Last ${games.length} games played (PS4/PS5):\n`);

for (const g of games) {
  const when = g.lastPlayedDateTime.slice(0, 10);
  console.log(`  ${when}  [${g.platform.padEnd(7)}]  ${g.name}`);
}
