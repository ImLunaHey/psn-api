import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { PSN, type Tokens } from '../src';

const TOKEN_FILE = '.psn-tokens.json';

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} (your sony.com NPSSO cookie value)`);
  return v;
};

const loadTokens = (): Tokens | null => {
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, 'utf8')) as Tokens;
  } catch {
    return null;
  }
};

const cached = loadTokens();
const psn = cached
  ? new PSN({ tokens: cached })
  : new PSN({ npsso: requireEnv('NPSSO') });

psn.onTokenRefresh((tokens) =>
  writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2)),
);

const me = await psn.users.me();
const profile = await me.profile();
console.log(`Hello ${profile.onlineId} — tokens cached at ${TOKEN_FILE}`);
