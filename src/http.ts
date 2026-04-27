import { exchangeNpsso, refreshTokens } from './auth';
import {
  AuthExpired,
  AuthInvalid,
  NotFound,
  PSNError,
  RateLimited,
} from './errors';
import type { Tokens } from './types';

/**
 * Called whenever the client obtains new tokens — both on first auth
 * (NPSSO exchange) and on refresh-token rotation. Use this to persist
 * tokens between sessions.
 *
 * @example
 * psn.onTokenRefresh((tokens) => {
 *   fs.writeFileSync('.psn-tokens.json', JSON.stringify(tokens));
 * });
 */
export type TokenChangeListener = (tokens: Tokens) => void;

/**
 * How to authenticate the client.
 *
 * - `npsso` — long-lived session token from sony.com. Lazily exchanged
 *   for OAuth tokens on the first request.
 * - `tokens` — OAuth tokens you already have (e.g. persisted from a
 *   previous session via {@link TokenChangeListener}).
 */
export type HttpInit = { tokens: Tokens } | { npsso: string };

export class Http {
  private tokens: Tokens | null;
  private readonly npsso: string | null;
  private authing: Promise<Tokens> | null = null;
  private readonly listeners = new Set<TokenChangeListener>();

  constructor(init: HttpInit) {
    if ('tokens' in init) {
      this.tokens = init.tokens;
      this.npsso = null;
    } else {
      this.tokens = null;
      this.npsso = init.npsso;
    }
  }

  onTokenRefresh(fn: TokenChangeListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  getTokens(): Tokens | null {
    return this.tokens;
  }

  async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    if (!this.tokens) await this.authenticate();

    let res = await this.fetch(url, init);
    if (res.status === 401) {
      await this.authenticate();
      res = await this.fetch(url, init);
    }

    if (!res.ok) throw await toError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  private async fetch(url: string, init: RequestInit): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${this.tokens!.accessToken}`);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    return fetch(url, { ...init, headers });
  }

  private async authenticate(): Promise<void> {
    const isRefresh = this.tokens !== null;

    this.authing ??= (
      isRefresh ? refreshTokens(this.tokens!.refreshToken) : exchangeNpsso(this.npsso!)
    )
      .then((next) => {
        this.tokens = next;
        for (const fn of this.listeners) fn(next);
        return next;
      })
      .finally(() => {
        this.authing = null;
      });

    try {
      await this.authing;
    } catch (e) {
      if (isRefresh) {
        throw new AuthExpired(
          'Refresh token rejected — re-authenticate with a fresh NPSSO',
          e,
        );
      }
      throw e;
    }
  }
}

async function toError(res: Response): Promise<PSNError> {
  const body = await res.text().catch(() => '');
  if (res.status === 404) return new NotFound(`Not found: ${res.url}`);
  if (res.status === 429) {
    const header = res.headers.get('retry-after');
    const retryAfter = header ? Number(header) : undefined;
    return new RateLimited(
      `Rate limited: ${res.url}`,
      Number.isFinite(retryAfter) ? retryAfter : undefined,
    );
  }
  if (res.status === 401 || res.status === 403) {
    return new AuthInvalid(`Unauthorized (${res.status}): ${body}`);
  }
  return new PSNError(`HTTP ${res.status} ${res.statusText}: ${body}`);
}
