import type { Platform } from '../types';

/**
 * A game played by a user, as reported by the gamelist API. Includes
 * play duration, first/last played timestamps, and play count.
 */
export type PlayedGame = {
  /** Unique title ID for the played version, e.g. `CUSA00417_00`. */
  titleId: string;
  /** Display name. */
  name: string;
  /** Localized display name. */
  localizedName: string;
  /** Game icon URL. */
  imageUrl: string;
  /** Localized icon URL. */
  localizedImageUrl: string;
  /** Platform category — `ps4_game`, `ps5_native_game`, `pspc_game`, `unknown`. */
  category: string;
  /** Ownership model — `none`, `none_purchased`, `ps_plus`. */
  service: string;
  /** Number of separate play sessions. */
  playCount: number;
  /** Game concept metadata. */
  concept: {
    id: number;
    titleIds: string[];
    name: string;
    media: unknown;
  };
  /** Media assets — screenshots, videos, etc. */
  media: unknown;
  /** ISO timestamp of the user's first session. */
  firstPlayedDateTime: string;
  /** ISO timestamp of the user's most recent session. */
  lastPlayedDateTime: string;
  /** Total play duration as an ISO 8601 duration string (`PT12H34M56S`). */
  playDuration: string;
};

/**
 * A game from a user's recently played list (GraphQL endpoint, PS4/PS5
 * only). Independent of trophy progress.
 */
export type RecentlyPlayedGame = {
  titleId: string;
  conceptId: string;
  name: string;
  imageUrl: string;
  platform: Platform | 'UNKNOWN';
  productId: string | null;
  entitlementId: string | null;
  isActive: boolean | null;
  lastPlayedDateTime: string;
  /** Subscription source, e.g. `NONE` or a service identifier. */
  subscriptionService: string;
};

/**
 * A game in the user's purchased library (GraphQL endpoint, PS4/PS5
 * only).
 */
export type PurchasedGame = {
  titleId: string;
  /** Concept ID, when available. */
  conceptId: string | null;
  /** Entitlement ID — Sony's purchase reference. */
  entitlementId: string;
  productId: string | null;
  name: string;
  imageUrl: string;
  /** Platform metadata as returned by GraphQL. */
  platform: unknown;
  isActive: boolean;
  isDownloadable: boolean;
  isPreOrder: boolean;
  /** PS Plus / EA Play / etc. tier this game is associated with, if any. */
  membership: unknown;
};

/**
 * Options for {@link MeHandle.recentlyPlayedGames}.
 */
export type RecentlyPlayedOpts = {
  /** Defaults to 50. */
  limit?: number;
  /** Categories to filter by. Defaults to `['ps4_game', 'ps5_native_game']`. */
  categories?: string[];
};

/**
 * Options for {@link MeHandle.purchasedGames}.
 */
export type PurchasedGamesOpts = {
  isActive?: boolean;
  platform?: ('ps4' | 'ps5')[];
  size?: number;
  start?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
};
