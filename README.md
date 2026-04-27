# @imlunahey/psn-api

A modern PlayStation Network API client. One stateful client, automatic token refresh, typed errors, ergonomic resource handles.

```ts
import { PSN } from '@imlunahey/psn-api';

const psn = new PSN({ npsso: process.env.NPSSO! });
const luna = await psn.users.byName('imlunahey');

const titles = await luna.trophies.titles();
const recent = titles[0];
const trophies = await recent.earned(); // definitions + earned status merged
```

## Installation

```sh
pnpm add @imlunahey/psn-api
# or npm / yarn / bun
```

Requires Node 20+. Ships ESM and CJS.

## Getting your NPSSO

The NPSSO is a long-lived session cookie from sony.com. The library exchanges it for OAuth tokens lazily on the first request and refreshes them automatically thereafter.

1. In a browser, sign in to <https://www.playstation.com>.
2. Visit <https://ca.account.sony.com/api/v1/ssocookie>.
3. Copy the `npsso` value from the JSON response — it looks like `{"npsso":"abc…xyz"}`.
4. Pass it as the `NPSSO` env var (or directly to `new PSN({ npsso })`).

NPSSO tokens are good for about 60 days. The library only uses them once — for the initial OAuth exchange — and rotates the resulting access/refresh tokens on its own.

## Quick start

```ts
import { PSN } from '@imlunahey/psn-api';

const psn = new PSN({ npsso: process.env.NPSSO! });

// the authenticated user
const me = await psn.users.me();
console.log(await me.profile());

// any user by online ID
const luna = await psn.users.byName('imlunahey');
const presence = await luna.presence();

// known account ID — no network call to construct the handle
const friend = psn.users.byAccountId('1234567890');

// list trophy titles (one page, or async-iterate everything)
const titles = await luna.trophies.titles({ limit: 50 });
for await (const t of luna.trophies.titles.all()) {
  console.log(t.name);
}

// trophies for one title — definitions + earned status merged
const recent = titles[0]!;
const trophies = await recent.earned();
console.log(`${trophies.filter((t) => t.earned).length}/${trophies.length} earned`);
```

## What you can do

Resources, mostly grouped onto `psn.users`, with handle methods for each user.

```ts
// User lookups
psn.users.me()                        // -> MeHandle (extends UserHandle)
psn.users.byName(onlineId)            // -> UserHandle
psn.users.byAccountId(accountId)      // -> UserHandle (no network call)

// Search
psn.search.users('luna')              // -> SearchUserResult[]
psn.search.userHandle(result)         // -> UserHandle
psn.search.universal(q, ['…'])        // -> raw multi-domain response

// On any UserHandle
user.profile()
user.presence()
user.shareLink()                      // public share URL + image asset
user.friends()                        // Listable<UserHandle>
user.playedGames()                    // Listable<PlayedGame>

// Trophy operations live under .trophies
user.trophies.stats()                 // account-wide level/tier/counts
user.trophies.titles()                // Listable<TrophyTitleHandle>
user.trophies.forTitles(ids)          // bulk lookup by Sony title ID, max 5

// On MeHandle (everything above, plus):
me.devices()                          // logged-in consoles/handhelds
me.recentlyPlayed()                   // PS4/PS5, GraphQL
me.purchased()                        // PS4/PS5 purchase library, GraphQL
me.friendRequests()                   // received friend requests
me.blocked()                          // Listable<UserHandle>

// On a TrophyTitleHandle
title.groups()                        // groups + per-group earned/defined/progress
title.earned(groupId?)                // trophies with earned status merged
title.summary()                       // total earned/defined + progress
```

Every list endpoint (`trophies.titles`, `friends`, `playedGames`, `friendRequests`, `blocked`, etc.) is callable directly for a single page or via `.all()` for an async iterator over every page.

## Persisting tokens

Construction is synchronous; the NPSSO → OAuth exchange happens on the first request. Subscribe to token changes to keep them across runs:

```ts
import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { PSN, type Tokens } from '@imlunahey/psn-api';

const TOKEN_FILE = '.psn-tokens.json';

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
  : new PSN({ npsso: process.env.NPSSO! });

psn.onTokenRefresh((tokens) =>
  writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2)),
);
```

`onTokenRefresh` fires on the initial auth and on every subsequent refresh. It returns an unsubscribe function.

## Error handling

Every error extends `PSN.Error`. Branch on the typed subclasses:

```ts
import { PSN } from '@imlunahey/psn-api';

try {
  await psn.users.byName('does-not-exist');
} catch (e) {
  if (e instanceof PSN.NotFound) {
    // unknown online ID, deleted account, etc.
  } else if (e instanceof PSN.RateLimited) {
    console.log('retry after', e.retryAfter, 'seconds');
  } else if (e instanceof PSN.AuthExpired) {
    // refresh token rejected — re-auth with a fresh NPSSO
  } else if (e instanceof PSN.AuthInvalid) {
    // bad NPSSO or rejected credentials
  } else if (e instanceof PSN.Error) {
    // any other PSN error
  }
}
```

## Examples

Runnable scripts in [`examples/`](./examples):

| Script | What it does |
| --- | --- |
| `examples/basic.ts` | Authenticate, fetch own profile, look up another user |
| `examples/persist-tokens.ts` | Cache tokens to disk and reuse across runs |
| `examples/trophies.ts` | Fetch a title's trophies with earned status |
| `examples/iterate-all.ts` | Async-iterate every trophy title |
| `examples/search.ts` | Search for users by name and promote a result to a handle |
| `examples/friends.ts` | List friends and fetch their profiles concurrently |
| `examples/recently-played.ts` | PS4/PS5 recently-played games (GraphQL) |
| `examples/trophy-profile.ts` | Account-wide trophy level, tier, and counts |

```sh
NPSSO=... pnpm example:basic
```

## Credits

Built as an alternative to [`psn-api`](https://github.com/achievements-app/psn-api) by the [Achievements App](https://github.com/achievements-app) team. Their library reverse-engineered the PSN endpoints, auth flow, and the GraphQL persisted-query hashes used here — none of this would exist without that mapping work. Huge thanks to that project.

This rewrite covers the same surface but trades the function-based shape (with manual auth threading on every call) for a single stateful client, automatic token refresh, async-iterator pagination, typed errors, and resource handles for users, trophy titles, and search.

## License

MIT
