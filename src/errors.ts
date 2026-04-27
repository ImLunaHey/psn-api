/**
 * Base class for every error this library throws. Catch this if you
 * want a single handler for "something went wrong with PSN."
 */
export class PSNError extends Error {
  override name = 'PSNError';
  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
  }
}

/**
 * The requested resource doesn't exist (HTTP 404). For user lookups
 * this usually means the online ID was misspelled or the account has
 * been deleted.
 */
export class NotFound extends PSNError {
  override name = 'PSNNotFound';
}

/**
 * PSN returned 429. {@link RateLimited.retryAfter} carries the
 * server-suggested delay in seconds, when present.
 */
export class RateLimited extends PSNError {
  override name = 'PSNRateLimited';
  /** Seconds the server suggests waiting before retrying. */
  readonly retryAfter?: number;
  constructor(message: string, retryAfter?: number) {
    super(message);
    if (retryAfter !== undefined) this.retryAfter = retryAfter;
  }
}

/**
 * The refresh token was rejected. Re-authenticate with a fresh NPSSO.
 */
export class AuthExpired extends PSNError {
  override name = 'PSNAuthExpired';
}

/**
 * Credentials were invalid: bad NPSSO, malformed tokens, or PSN
 * returned 401/403 outside the refresh path.
 */
export class AuthInvalid extends PSNError {
  override name = 'PSNAuthInvalid';
}
