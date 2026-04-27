import { PSN } from '../src';

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} (your sony.com NPSSO cookie value)`);
  return v;
};

const psn = new PSN({ npsso: requireEnv('NPSSO') });
const me = await psn.users.me();

const firstPage = await me.friends({ limit: 20 });
console.log(`Fetching profiles for first ${firstPage.length} friends:\n`);

const profiles = await Promise.all(firstPage.map((f) => f.profile()));
for (const p of profiles) {
  const ps = p.isPlus ? 'PS+' : '   ';
  console.log(`  ${ps}  ${p.onlineId}`);
}

let total = 0;
for await (const _ of me.friends.all()) total++;
console.log(`\nTotal friends: ${total}`);
