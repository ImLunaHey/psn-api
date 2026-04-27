/**
 * Stable opaque numeric string identifying a PSN account. Unlike
 * {@link OnlineId}, this never changes for the lifetime of the account.
 */
export type AccountId = string;

/**
 * The user-visible PSN ID (the name shown on a profile). Mutable —
 * users can change it. Use {@link AccountId} when you need a stable
 * reference.
 */
export type OnlineId = string;

/**
 * Identifier for a trophy-bearing title, e.g. `NPWR21532_00`.
 */
export type NpCommunicationId = string;

/**
 * Platform a title was released on.
 */
export type Platform = 'PS3' | 'PS4' | 'PS5' | 'PSVITA' | 'PSPC';

/**
 * The four trophy tiers PSN tracks.
 */
export type TrophyKind = 'platinum' | 'gold' | 'silver' | 'bronze';

/**
 * Counts of trophies broken down by tier.
 */
export type TrophyCounts = Record<TrophyKind, number>;

/**
 * OAuth tokens used to authenticate every PSN request. Persist these
 * across sessions to skip the NPSSO exchange on next start — see
 * {@link PSN.onTokenRefresh}.
 */
export type Tokens = {
  /** Bearer token sent as `Authorization: Bearer <accessToken>`. */
  accessToken: string;
  /** Long-lived token used to obtain a fresh access token. */
  refreshToken: string;
  /** Unix milliseconds when {@link Tokens.accessToken} expires. */
  expiresAt: number;
};

/**
 * A user's public profile.
 */
export type Profile = {
  accountId: AccountId;
  onlineId: OnlineId;
  /** "About me" text the user has set on their profile. */
  aboutMe: string;
  /** URL to the highest-resolution avatar image. */
  avatarUrl: string;
  /** Whether the account currently has PlayStation Plus. */
  isPlus: boolean;
  /** ISO language codes the user has set as preferred. */
  languages: string[];
};

/**
 * A user's online status snapshot.
 */
export type Presence = {
  onlineStatus: 'online' | 'offline' | 'standby';
  /** ISO timestamp of the last time the user was online (if known). */
  lastOnlineDate?: string;
  /** Platform the user was last/currently using. */
  primaryPlatform?: Platform;
};

/**
 * Pagination input for list endpoints.
 */
export type ListOpts = {
  /** Items per request. Defaults to 100. */
  limit?: number;
  /** Items to skip from the start of the result set. Defaults to 0. */
  offset?: number;
};
