import { PSN } from '../src';

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} (your sony.com NPSSO cookie value)`);
  return v;
};

const psn = new PSN({ npsso: requireEnv('NPSSO') });
const me = await psn.users.me();

const tp = await me.trophies.stats();
const total =
  tp.earnedTrophies.platinum +
  tp.earnedTrophies.gold +
  tp.earnedTrophies.silver +
  tp.earnedTrophies.bronze;

console.log(`Trophy Level ${tp.trophyLevel} (Tier ${tp.tier})`);
console.log(`${tp.progress}% to next level`);
console.log(`\nTotal earned: ${total}`);
console.log(`  platinum: ${tp.earnedTrophies.platinum}`);
console.log(`  gold:     ${tp.earnedTrophies.gold}`);
console.log(`  silver:   ${tp.earnedTrophies.silver}`);
console.log(`  bronze:   ${tp.earnedTrophies.bronze}`);
