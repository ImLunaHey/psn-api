import * as errors from './errors';
import { Http, type HttpInit, type TokenChangeListener } from './http';
import { SearchResource } from './resources/search';
import { UsersResource } from './resources/users';
import type { Tokens } from './types';

/**
 * Options for constructing a {@link PSN} client. Either:
 *
 * - `{ npsso }` — pass the session token from sony.com. The client
 *   exchanges it for OAuth tokens lazily on the first request.
 * - `{ tokens }` — pass pre-exchanged tokens (e.g. persisted from a
 *   previous session). No initial network call needed.
 */
export type PSNOptions = HttpInit;

/**
 * PlayStation Network API client.
 *
 * Construction is synchronous and free; the NPSSO → OAuth exchange
 * happens on the first request and is shared between concurrent
 * callers. Refresh-on-401 is automatic — subscribe via
 * {@link PSN.onTokenRefresh} to persist tokens between sessions.
 *
 * @example NPSSO (lazy auth on first request)
 * const psn = new PSN({ npsso: process.env.NPSSO! });
 * const me = await psn.users.me();
 *
 * @example Resume from persisted tokens
 * const tokens = JSON.parse(await fs.readFile('.psn-tokens.json', 'utf8'));
 * const psn = new PSN({ tokens });
 * psn.onTokenRefresh((t) =>
 *   fs.writeFile('.psn-tokens.json', JSON.stringify(t)),
 * );
 */
export class PSN {
  /** Base error class — every error this library throws extends this. */
  static readonly Error = errors.PSNError;
  /** Thrown when PSN returns 404 (e.g. unknown online ID). */
  static readonly NotFound = errors.NotFound;
  /** Thrown when PSN returns 429. Carries `retryAfter` seconds. */
  static readonly RateLimited = errors.RateLimited;
  /** Thrown when the refresh token is rejected — re-auth with a fresh NPSSO. */
  static readonly AuthExpired = errors.AuthExpired;
  /** Thrown when credentials are rejected (bad NPSSO, malformed tokens). */
  static readonly AuthInvalid = errors.AuthInvalid;

  private readonly http: Http;

  /** Look up users by online ID, account ID, or `me()`. */
  readonly users: UsersResource;

  /** PSN universal search — find users (and other entities). */
  readonly search: SearchResource;

  constructor(opts: PSNOptions) {
    this.http = new Http(opts);
    this.users = new UsersResource(this.http);
    this.search = new SearchResource(this.http);
  }

  /**
   * Subscribe to token changes. Fires on first auth and on every
   * subsequent refresh. Use this to persist tokens between sessions.
   *
   * @returns an unsubscribe function.
   * @example
   * const stop = psn.onTokenRefresh(saveTokens);
   * // later: stop();
   */
  onTokenRefresh(fn: TokenChangeListener): () => void {
    return this.http.onTokenRefresh(fn);
  }

  /**
   * The current OAuth tokens, or `null` if no request has triggered
   * authentication yet (only possible when constructed with `{ npsso }`).
   */
  get tokens(): Tokens | null {
    return this.http.getTokens();
  }
}
