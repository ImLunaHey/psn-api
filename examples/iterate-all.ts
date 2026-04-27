import { PSN } from '../src';

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} (your sony.com NPSSO cookie value)`);
  return v;
};

const psn = new PSN({ npsso: requireEnv('NPSSO') });
const me = await psn.users.me();

let count = 0;
for await (const title of me.trophies.titles.all()) {
  console.log(`${(++count).toString().padStart(4)}. ${title.name}`);
}
console.log(`Total: ${count} titles`);
