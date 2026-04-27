import type { Http } from '../http';
import { listable, paginate, type Listable } from '../pagination';
import type {
  AccountId,
  ListOpts,
  OnlineId,
  Platform,
  Presence,
  Profile,
  TrophyCounts,
} from '../types';
import type {
  PlayedGame,
  PurchasedGame,
  PurchasedGamesOpts,
  RecentlyPlayedGame,
  RecentlyPlayedOpts,
} from './games';
import { TrophyTitleHandle } from './trophies';

const PROFILE_BASE = 'https://m.np.playstation.com/api/userProfile/v1/internal';
const LEGACY_PROFILE = 'https://us-prof.np.community.playstation.net/userProfile/v1';
const TROPHY_BASE = 'https://m.np.playstation.com/api/trophy/v1';
const GAMELIST_BASE = 'https://m.np.playstation.com/api/gamelist/v2/users';
const CPSS_BASE = 'https://m.np.playstation.com/api/cpss';
const DMS_BASE = 'https://dms.api.playstation.com/api';
const GRAPHQL_URL = 'https://web.np.playstation.com/api/graphql/v1/op';

const HASH_USER_GAME_LIST =
  'e780a6d8b921ef0c59ec01ea5c5255671272ca0d819edb61320914cf7a78b3ae';
const HASH_PURCHASED_GAME_LIST =
  '827a423f6a8ddca4107ac01395af2ec0eafd8396fc7fa204aaf9b7ed2eefa168';

/**
 * Account-wide trophy stats for a user — overall level, tier, progress
 * toward the next level, and counts by tier.
 */
export type TrophyStats = {
  accountId: AccountId;
  /** Overall trophy level. */
  trophyLevel: number;
  /** Progress toward the next level (0–100). */
  progress: number;
  /** Tier bracket (1–10). Each tier groups several levels together. */
  tier: number;
  /** Earned trophies broken down by tier. */
  earnedTrophies: TrophyCounts;
};

/**
 * Trophy progress for a single title in a bulk lookup. Returned by
 * {@link TrophiesNamespace.forTitles}.
 */
export type TrophyProgress = {
  /** PS Store title ID (e.g. `CUSA00417_00`). */
  titleId: string;
  /** Game name. */
  trophyTitleName: string;
  /** NP communication ID — useful for follow-up calls. */
  npCommunicationId: string;
  /** Trophies earned for this title, by tier. */
  earnedTrophies: TrophyCounts;
  /** Trophies defined for this title, by tier. */
  definedTrophies: TrophyCounts;
  /** Completion percentage (0–100). */
  progress: number;
  /** Whether the user has hidden this title from their public profile. */
  hiddenFlag: boolean;
  lastUpdatedDateTime: string;
};

/**
 * Shareable profile link + image (for QR codes etc.). Returned by
 * {@link UserHandle.shareLink}.
 */
export type ShareableProfileLink = {
  /** Public profile URL anyone can visit. */
  shareUrl: string;
  /** Sharable image asset (typically used as a QR-style preview). */
  shareImageUrl: string;
  /** Where the {@link shareImageUrl} links to when clicked. */
  shareImageUrlDestination: string;
};

/**
 * A device this account is logged into — console, handheld, etc.
 */
export type Device = {
  deviceId: string;
  deviceType: 'PS5' | 'PS4' | 'PS3' | 'PSVita';
};

/**
 * A pending received friend request.
 */
export type FriendRequest = {
  /** Account ID of the user who sent the request. */
  accountId: AccountId;
};

type RawProfileResponse = {
  profile: {
    accountId: AccountId;
    onlineId: OnlineId;
    aboutMe: string;
    avatars: Array<{ size: string; url: string }>;
    languagesUsed: string[];
    plus: number;
  };
};

type RawMeResponse = {
  accountId: AccountId;
  onlineId: OnlineId;
};

type RawPresenceResponse = {
  basicPresence: {
    primaryPlatformInfo?: {
      onlineStatus: 'online' | 'offline' | 'standby';
      platform: string;
    };
    lastAvailableDate?: string;
  };
};

type RawTrophyTitlesResponse = {
  trophyTitles: Array<{
    npCommunicationId: string;
    trophyTitleName: string;
    trophyTitleIconUrl: string;
    trophyTitlePlatform: string;
    hasTrophyGroups: boolean;
    earnedTrophies: TrophyCounts;
    definedTrophies: TrophyCounts;
    progress: number;
    lastUpdatedDateTime?: string;
  }>;
  totalItemCount: number;
};

type RawFriendsResponse = {
  friends: AccountId[];
  totalItemCount: number;
  nextOffset?: number;
};

type RawFriendRequestsResponse = {
  receivedRequests: AccountId[];
  totalItemCount: number;
};

type RawBlockedResponse = {
  blockList: AccountId[];
  nextOffset?: number;
};

type RawPlayedGamesResponse = {
  titles: PlayedGame[];
  totalItemCount: number;
};

type RawTrophyStatsResponse = {
  accountId: AccountId;
  trophyLevel: string | number;
  progress: number;
  tier: number;
  earnedTrophies: TrophyCounts;
};

type RawTrophiesByTitlesResponse = {
  trophyTitles: Array<{
    npServiceName: string;
    npCommunicationId: string;
    trophyTitleName: string;
    npTitleId: string;
    earnedTrophies: TrophyCounts;
    definedTrophies: TrophyCounts;
    progress: number;
    hiddenFlag: boolean;
    lastUpdatedDateTime: string;
  }>;
};

type RawShareableLinkResponse = {
  shareUrl: string;
  shareImageUrl: string;
  shareImageUrlDestination: string;
};

type RawDevicesResponse = {
  deviceList: Array<{
    deviceId: string;
    deviceType: Device['deviceType'];
  }>;
};

type RawRecentlyPlayedResponse = {
  data: {
    gameLibraryTitlesRetrieve: {
      games: Array<{
        titleId: string;
        conceptId: string;
        name: string;
        image: { url: string };
        platform: Platform | 'UNKNOWN';
        productId: string | null;
        entitlementId: string | null;
        isActive: boolean | null;
        lastPlayedDateTime: string;
        subscriptionService: string;
      }>;
    };
  };
};

type RawPurchasedResponse = {
  data: {
    purchasedTitlesRetrieve: {
      games: Array<{
        titleId: string;
        conceptId: string | null;
        entitlementId: string;
        productId: string | null;
        name: string;
        image: { url: string };
        platform: unknown;
        isActive: boolean;
        isDownloadable: boolean;
        isPreOrder: boolean;
        membership: unknown;
      }>;
    };
  };
};

const trophyTitlesUrl = (accountId: AccountId, limit: number, offset: number) =>
  `${TROPHY_BASE}/users/${accountId}/trophyTitles?limit=${limit}&offset=${offset}`;

const friendsUrl = (accountId: AccountId, limit: number, offset: number) =>
  `${PROFILE_BASE}/users/${accountId}/friends?limit=${limit}&offset=${offset}`;

const playedGamesUrl = (accountId: AccountId, limit: number, offset: number) =>
  `${GAMELIST_BASE}/${accountId}/titles?limit=${limit}&offset=${offset}`;

const toTrophyTitleHandle = (
  http: Http,
  accountId: AccountId,
  t: RawTrophyTitlesResponse['trophyTitles'][number],
): TrophyTitleHandle => {
  const meta: ConstructorParameters<typeof TrophyTitleHandle>[2] = {
    npCommunicationId: t.npCommunicationId,
    name: t.trophyTitleName,
    iconUrl: t.trophyTitleIconUrl,
    platform: t.trophyTitlePlatform,
    hasTrophyGroups: t.hasTrophyGroups,
    earned: t.earnedTrophies,
    defined: t.definedTrophies,
    progress: t.progress,
  };
  if (t.lastUpdatedDateTime !== undefined) meta.lastUpdatedAt = t.lastUpdatedDateTime;
  return new TrophyTitleHandle(http, accountId, meta);
};

/**
 * Trophy operations for a specific user — namespaced under
 * {@link UserHandle.trophies}. Holds the listable trophy-titles
 * collection, account-wide stats, and bulk-by-title-id lookup.
 */
export class TrophiesNamespace {
  /**
   * The user's trophy titles (games with at least one tracked trophy).
   *
   * - Call directly for a single page: `await luna.trophies.titles({ limit: 50 })`
   * - Call `.all()` to async-iterate every page transparently.
   */
  readonly titles: Listable<TrophyTitleHandle>;

  constructor(
    private readonly http: Http,
    private readonly accountId: AccountId,
  ) {
    this.titles = listable(
      (opts?: ListOpts) => this.listTitles(opts),
      () => this.iterTitles(),
    );
  }

  /**
   * Account-wide trophy stats — overall level, tier, progress toward
   * the next level, and earned counts by tier.
   */
  async stats(): Promise<TrophyStats> {
    const raw = await this.http.request<RawTrophyStatsResponse>(
      `${TROPHY_BASE}/users/${this.accountId}/trophySummary`,
    );
    return {
      accountId: raw.accountId,
      trophyLevel: Number(raw.trophyLevel),
      progress: raw.progress,
      tier: raw.tier,
      earnedTrophies: raw.earnedTrophies,
    };
  }

  /**
   * Bulk lookup of trophy progress for up to 5 titles by Sony's title
   * ID (e.g. `CUSA00417_00`, `PPSA01325_00`). Useful when you have a
   * list of game IDs from another source.
   */
  async forTitles(titleIds: string[]): Promise<TrophyProgress[]> {
    if (titleIds.length === 0) return [];
    if (titleIds.length > 5) {
      throw new Error('PSN allows at most 5 title IDs per bulk lookup');
    }
    const raw = await this.http.request<RawTrophiesByTitlesResponse>(
      `${TROPHY_BASE}/users/${this.accountId}/titles/trophyTitles?npTitleIds=${titleIds.join(',')}`,
    );
    return raw.trophyTitles.map((t) => ({
      titleId: t.npTitleId,
      trophyTitleName: t.trophyTitleName,
      npCommunicationId: t.npCommunicationId,
      earnedTrophies: t.earnedTrophies,
      definedTrophies: t.definedTrophies,
      progress: t.progress,
      hiddenFlag: t.hiddenFlag,
      lastUpdatedDateTime: t.lastUpdatedDateTime,
    }));
  }

  private async listTitles(opts?: ListOpts): Promise<TrophyTitleHandle[]> {
    const limit = opts?.limit ?? 100;
    const offset = opts?.offset ?? 0;
    const raw = await this.http.request<RawTrophyTitlesResponse>(
      trophyTitlesUrl(this.accountId, limit, offset),
    );
    return raw.trophyTitles.map((t) => toTrophyTitleHandle(this.http, this.accountId, t));
  }

  private iterTitles(): AsyncIterable<TrophyTitleHandle> {
    return paginate(async (offset, limit) => {
      const raw = await this.http.request<RawTrophyTitlesResponse>(
        trophyTitlesUrl(this.accountId, limit, offset),
      );
      return {
        items: raw.trophyTitles.map((t) => toTrophyTitleHandle(this.http, this.accountId, t)),
        total: raw.totalItemCount,
      };
    });
  }
}

/**
 * A handle to one PSN user. Construction is free — methods on this
 * class issue network calls lazily.
 */
export class UserHandle {
  /** Trophy-related operations for this user. */
  readonly trophies: TrophiesNamespace;

  /**
   * The user's friends — paginated. Items are {@link UserHandle}s with
   * only the account ID populated; call `.profile()` to fetch details.
   */
  readonly friends: Listable<UserHandle>;

  /**
   * The user's recently-played games (gamelist API). Includes play
   * duration, first/last played, etc.
   */
  readonly playedGames: Listable<PlayedGame>;

  constructor(
    protected readonly http: Http,
    /** The account ID this handle was constructed with. */
    public readonly accountId: AccountId,
    private cachedOnlineId?: OnlineId,
  ) {
    this.trophies = new TrophiesNamespace(http, accountId);
    this.friends = listable(
      (opts?: ListOpts) => this.listFriends(opts),
      () => this.iterFriends(),
    );
    this.playedGames = listable(
      (opts?: ListOpts) => this.listPlayedGames(opts),
      () => this.iterPlayedGames(),
    );
  }

  /**
   * The cached online ID, if known. Set after a successful
   * {@link profile} call or if it was passed in at construction.
   */
  get onlineId(): OnlineId | undefined {
    return this.cachedOnlineId;
  }

  /**
   * Fetch the user's full public profile.
   *
   * @throws {@link NotFound} if the account doesn't exist.
   */
  async profile(): Promise<Profile> {
    const raw = await this.http.request<RawProfileResponse>(
      `${LEGACY_PROFILE}/users/${this.accountId}/profile2`,
    );
    this.cachedOnlineId = raw.profile.onlineId;
    const lastAvatar = raw.profile.avatars[raw.profile.avatars.length - 1];
    return {
      accountId: raw.profile.accountId,
      onlineId: raw.profile.onlineId,
      aboutMe: raw.profile.aboutMe,
      avatarUrl: lastAvatar?.url ?? '',
      isPlus: raw.profile.plus === 1,
      languages: raw.profile.languagesUsed,
    };
  }

  /**
   * Fetch the user's current online status and platform.
   */
  async presence(): Promise<Presence> {
    const raw = await this.http.request<RawPresenceResponse>(
      `${PROFILE_BASE}/users/${this.accountId}/basicPresences`,
    );
    const info = raw.basicPresence.primaryPlatformInfo;
    const presence: Presence = {
      onlineStatus: info?.onlineStatus ?? 'offline',
    };
    if (raw.basicPresence.lastAvailableDate !== undefined) {
      presence.lastOnlineDate = raw.basicPresence.lastAvailableDate;
    }
    if (info?.platform !== undefined) {
      presence.primaryPlatform = info.platform as Platform;
    }
    return presence;
  }

  /**
   * Fetch a shareable profile link and accompanying image asset.
   */
  async shareLink(): Promise<ShareableProfileLink> {
    return this.http.request<RawShareableLinkResponse>(
      `${CPSS_BASE}/v1/share/profile/${this.accountId}`,
    );
  }

  private async listFriends(opts?: ListOpts): Promise<UserHandle[]> {
    const limit = opts?.limit ?? 100;
    const offset = opts?.offset ?? 0;
    const raw = await this.http.request<RawFriendsResponse>(
      friendsUrl(this.accountId, limit, offset),
    );
    return raw.friends.map((id) => new UserHandle(this.http, id));
  }

  private iterFriends(): AsyncIterable<UserHandle> {
    return paginate(async (offset, limit) => {
      const raw = await this.http.request<RawFriendsResponse>(
        friendsUrl(this.accountId, limit, offset),
      );
      return {
        items: raw.friends.map((id) => new UserHandle(this.http, id)),
        total: raw.totalItemCount,
      };
    });
  }

  private async listPlayedGames(opts?: ListOpts): Promise<PlayedGame[]> {
    const limit = opts?.limit ?? 100;
    const offset = opts?.offset ?? 0;
    const raw = await this.http.request<RawPlayedGamesResponse>(
      playedGamesUrl(this.accountId, limit, offset),
    );
    return raw.titles;
  }

  private iterPlayedGames(): AsyncIterable<PlayedGame> {
    return paginate(async (offset, limit) => {
      const raw = await this.http.request<RawPlayedGamesResponse>(
        playedGamesUrl(this.accountId, limit, offset),
      );
      return { items: raw.titles, total: raw.totalItemCount };
    });
  }
}

/**
 * Handle for the authenticated user. Extends {@link UserHandle} with
 * me-only endpoints (friend requests, blocks, devices, purchase
 * history, recently played).
 */
export class MeHandle extends UserHandle {
  /** Pending received friend requests. */
  readonly friendRequests: Listable<FriendRequest>;

  /** Accounts the user has blocked. */
  readonly blocked: Listable<UserHandle>;

  constructor(http: Http, accountId: AccountId, onlineId?: OnlineId) {
    super(http, accountId, onlineId);
    this.friendRequests = listable(
      (opts?: ListOpts) => this.listFriendRequests(opts),
      () => this.iterFriendRequests(),
    );
    this.blocked = listable(
      (opts?: ListOpts) => this.listBlocked(opts),
      () => this.iterBlocked(),
    );
  }

  /**
   * List devices (consoles, handhelds) currently logged into this
   * account.
   */
  async devices(): Promise<Device[]> {
    const raw = await this.http.request<RawDevicesResponse>(
      `${DMS_BASE}/v1/devices/accounts/me?includeFields=device,systemData&platform=PS5,PS4,PS3,PSVita`,
    );
    return raw.deviceList.map((d) => ({
      deviceId: d.deviceId,
      deviceType: d.deviceType,
    }));
  }

  /**
   * Recently-played games (PS4/PS5 only). Independent of trophy
   * progress — sourced from PSN's web library GraphQL endpoint.
   */
  async recentlyPlayed(opts?: RecentlyPlayedOpts): Promise<RecentlyPlayedGame[]> {
    const limit = opts?.limit ?? 50;
    const categories = (opts?.categories ?? ['ps4_game', 'ps5_native_game']).join(',');
    const raw = await this.http.request<RawRecentlyPlayedResponse>(
      graphqlUrl('getUserGameList', HASH_USER_GAME_LIST, { limit, categories }),
    );
    return raw.data.gameLibraryTitlesRetrieve.games.map((g) => ({
      titleId: g.titleId,
      conceptId: g.conceptId,
      name: g.name,
      imageUrl: g.image.url,
      platform: g.platform,
      productId: g.productId,
      entitlementId: g.entitlementId,
      isActive: g.isActive,
      lastPlayedDateTime: g.lastPlayedDateTime,
      subscriptionService: g.subscriptionService,
    }));
  }

  /**
   * Purchased games (PS4/PS5 only) — the user's purchase library from
   * PSN's web GraphQL endpoint.
   */
  async purchased(opts?: PurchasedGamesOpts): Promise<PurchasedGame[]> {
    const variables = {
      isActive: opts?.isActive ?? true,
      platform: opts?.platform ?? ['ps4', 'ps5'],
      size: opts?.size ?? 24,
      start: opts?.start ?? 0,
      sortBy: opts?.sortBy ?? 'ACTIVE_DATE',
      sortDirection: opts?.sortDirection ?? 'desc',
    };
    const raw = await this.http.request<RawPurchasedResponse>(
      graphqlUrl('getPurchasedGameList', HASH_PURCHASED_GAME_LIST, variables),
    );
    return raw.data.purchasedTitlesRetrieve.games.map((g) => ({
      titleId: g.titleId,
      conceptId: g.conceptId,
      entitlementId: g.entitlementId,
      productId: g.productId,
      name: g.name,
      imageUrl: g.image.url,
      platform: g.platform,
      isActive: g.isActive,
      isDownloadable: g.isDownloadable,
      isPreOrder: g.isPreOrder,
      membership: g.membership,
    }));
  }

  private async listFriendRequests(opts?: ListOpts): Promise<FriendRequest[]> {
    const limit = opts?.limit ?? 100;
    const offset = opts?.offset ?? 0;
    const raw = await this.http.request<RawFriendRequestsResponse>(
      `${PROFILE_BASE}/users/me/friends/receivedRequests?limit=${limit}&offset=${offset}`,
    );
    return raw.receivedRequests.map((accountId) => ({ accountId }));
  }

  private iterFriendRequests(): AsyncIterable<FriendRequest> {
    return paginate(async (offset, limit) => {
      const raw = await this.http.request<RawFriendRequestsResponse>(
        `${PROFILE_BASE}/users/me/friends/receivedRequests?limit=${limit}&offset=${offset}`,
      );
      return {
        items: raw.receivedRequests.map((accountId) => ({ accountId })),
        total: raw.totalItemCount,
      };
    });
  }

  private async listBlocked(opts?: ListOpts): Promise<UserHandle[]> {
    const limit = opts?.limit ?? 100;
    const offset = opts?.offset ?? 0;
    const raw = await this.http.request<RawBlockedResponse>(
      `${PROFILE_BASE}/users/me/blocks?limit=${limit}&offset=${offset}`,
    );
    return raw.blockList.map((id) => new UserHandle(this.http, id));
  }

  private iterBlocked(): AsyncIterable<UserHandle> {
    return paginate(async (offset, limit) => {
      const raw = await this.http.request<RawBlockedResponse>(
        `${PROFILE_BASE}/users/me/blocks?limit=${limit}&offset=${offset}`,
      );
      return {
        items: raw.blockList.map((id) => new UserHandle(this.http, id)),
        total: raw.nextOffset !== undefined ? Number.POSITIVE_INFINITY : offset + raw.blockList.length,
      };
    });
  }
}

const graphqlUrl = (
  operationName: string,
  hash: string,
  variables: Record<string, unknown>,
): string => {
  const params = new URLSearchParams({
    operationName,
    variables: JSON.stringify(variables),
    extensions: JSON.stringify({
      persistedQuery: { version: 1, sha256Hash: hash },
    }),
  });
  return `${GRAPHQL_URL}?${params.toString()}`;
};

/**
 * Look up users on PSN.
 */
export class UsersResource {
  constructor(private readonly http: Http) {}

  /**
   * Fetch a handle for the authenticated user.
   */
  async me(): Promise<MeHandle> {
    const raw = await this.http.request<RawMeResponse>(
      `${PROFILE_BASE}/users/me/profile`,
    );
    return new MeHandle(this.http, raw.accountId, raw.onlineId);
  }

  /**
   * Look up a user by their online ID (the visible PSN name).
   *
   * @throws {@link NotFound} if no account has that online ID.
   * @example
   * const luna = await psn.users.byName('imlunahey');
   * console.log(await luna.profile());
   */
  async byName(onlineId: OnlineId): Promise<UserHandle> {
    const raw = await this.http.request<RawProfileResponse>(
      `${LEGACY_PROFILE}/users/${onlineId}/profile2`,
    );
    return new UserHandle(this.http, raw.profile.accountId, raw.profile.onlineId);
  }

  /**
   * Get a handle for a known account ID without making a network call.
   * Useful when you've cached an ID from a previous lookup.
   */
  byAccountId(accountId: AccountId): UserHandle {
    return new UserHandle(this.http, accountId);
  }
}
