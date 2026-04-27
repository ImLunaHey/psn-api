import { PSN } from '../src';

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} (your sony.com NPSSO cookie value)`);
  return v;
};

const psn = new PSN({ npsso: requireEnv('NPSSO') });

const results = await psn.search.users('imlunahey');
console.log(`Found ${results.length} match(es):`);
for (const r of results.slice(0, 5)) {
  const ps = r.isPsPlus ? 'PS+' : '   ';
  console.log(`  ${ps}  ${r.onlineId.padEnd(20)} ${r.country}  (${r.accountId})`);
}

const first = results[0];
if (first) {
  const luna = psn.search.userHandle(first);
  const profile = await luna.profile();
  console.log('\nFirst hit profile:');
  console.log(`  about: ${profile.aboutMe || '(none)'}`);
  console.log(`  plus:  ${profile.isPlus}`);
}
