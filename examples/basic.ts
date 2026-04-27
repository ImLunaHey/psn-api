import { PSN } from '../src';

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} (your sony.com NPSSO cookie value)`);
  return v;
};

const psn = new PSN({ npsso: requireEnv('NPSSO') });

const me = await psn.users.me();
const myProfile = await me.profile();
console.log(`Signed in as ${myProfile.onlineId} (${myProfile.accountId})`);

const luna = await psn.users.byName('imlunahey');
const [profile, presence] = await Promise.all([luna.profile(), luna.presence()]);
console.log(`${profile.onlineId} — ${presence.onlineStatus}`);
console.log(profile.aboutMe);
