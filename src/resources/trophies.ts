import type { Http } from '../http';
import { PSNError } from '../errors';
import type {
  AccountId,
  NpCommunicationId,
  Platform,
  TrophyCounts,
  TrophyKind,
} from '../types';

const TROPHY_BASE = 'https://m.np.playstation.com/api/trophy/v1';

/**
 * Lightweight metadata about a trophy title (game). Full trophy
 * definitions and earned status are fetched on-demand via methods
 * on {@link TrophyTitleHandle}.
 */
export type TrophyTitleMeta = {
  npCommunicationId: NpCommunicationId;
  /** Display name of the title. */
  name: string;
  /** URL to the title's icon. */
  iconUrl: string;
  /** Platform string from PSN — usually a {@link Platform}. */
  platform: Platform | string;
  /** Whether the title has multiple trophy groups (e.g. base + DLCs). */
  hasTrophyGroups: boolean;
  /**
   * Earned counts by tier — populated when the handle came from a
   * trophy-titles list call (which carries this data inline). Absent
   * when constructed by ID.
   */
  earned?: TrophyCounts;
  /** Defined counts by tier — see {@link TrophyTitleMeta.earned}. */
  defined?: TrophyCounts;
  /** Completion percentage at fetch time, when known. */
  progress?: number;
  /** ISO timestamp of last progress update, when known. */
  lastUpdatedAt?: string;
};

/**
 * A trophy group within a title — the base set or a DLC pack. Includes
 * both the defined-trophy counts (from the title's catalog) and the
 * user's earned counts merged together.
 */
export type TrophyGroup = {
  /** ID to pass to {@link TrophyTitleHandle.earned}. `'default'` is the base set. */
  groupId: string;
  /** Display name of the group. */
  name: string;
  /** URL to the group's icon. */
  iconUrl: string;
  /** Total trophies defined in this group, by tier. */
  defined: TrophyCounts;
  /** Trophies earned in this group, by tier. */
  earned: TrophyCounts;
  /** Completion percentage for this group (0–100). */
  progress: number;
  /** Last time the user's progress for this group was updated (ISO). */
  lastUpdatedAt?: string;
};

/**
 * A single trophy with its definition (name, icon, type) and the
 * user's progress (earned, when, rarity) merged into one record.
 */
export type Trophy = {
  trophyId: number;
  /** Whether the trophy is hidden until earned. */
  hidden: boolean;
  /** Tier — `bronze`, `silver`, `gold`, `platinum`. */
  type: TrophyKind;
  /** Display name. May be redacted if {@link Trophy.hidden} and not earned. */
  name: string;
  /** Description text. May be redacted if {@link Trophy.hidden} and not earned. */
  detail: string;
  iconUrl: string;
  /** Group this trophy belongs to — see {@link TrophyTitleHandle.groups}. */
  groupId: string;
  /** Whether the user has earned this trophy. */
  earned: boolean;
  /** ISO timestamp when the user earned it. */
  earnedAt?: string;
  /** Percentage of all players who have earned this trophy (0–100). */
  rarity?: number;
};

/**
 * Aggregate progress for a title.
 */
export type TrophySummary = {
  /** Total trophies earned across every group. */
  earnedCount: number;
  /** Total trophies defined across every group. */
  totalCount: number;
  /** Completion percentage (0–100), as PSN reports it. */
  progress: number;
  /** Earned counts by tier. */
  earned: TrophyCounts;
  /** Defined counts by tier. */
  defined: TrophyCounts;
};

const summaryFromCounts = (
  earned: TrophyCounts,
  defined: TrophyCounts,
  progress: number,
): TrophySummary => ({
  earnedCount: earned.bronze + earned.silver + earned.gold + earned.platinum,
  totalCount: defined.bronze + defined.silver + defined.gold + defined.platinum,
  progress,
  earned,
  defined,
});

type RawGroupsResponse = {
  trophyGroups: Array<{
    trophyGroupId: string;
    trophyGroupName: string;
    trophyGroupIconUrl: string;
    definedTrophies: TrophyCounts;
  }>;
};

type RawGroupEarningsResponse = {
  progress: number;
  trophyGroups: Array<{
    trophyGroupId: string;
    progress: number;
    earnedTrophies: TrophyCounts;
    lastUpdatedDateTime?: string;
  }>;
};

type RawTrophiesResponse = {
  trophies: Array<{
    trophyId: number;
    trophyHidden: boolean;
    trophyType: TrophyKind;
    trophyName: string;
    trophyDetail: string;
    trophyIconUrl: string;
    trophyGroupId: string;
  }>;
};

type RawEarnedResponse = {
  trophies: Array<{
    trophyId: number;
    earned: boolean;
    earnedDateTime?: string;
    trophyEarnedRate?: string;
  }>;
};

type RawSummaryResponse = {
  trophyTitles: Array<{
    progress: number;
    definedTrophies: TrophyCounts;
    earnedTrophies: TrophyCounts;
  }>;
};

/**
 * A handle to one trophy title for a specific user. Construction is
 * free; methods issue network calls.
 */
export class TrophyTitleHandle {
  constructor(
    private readonly http: Http,
    private readonly accountId: AccountId,
    public readonly meta: TrophyTitleMeta,
  ) {}

  /** Display name of the title. */
  get name(): string {
    return this.meta.name;
  }
  get npCommunicationId(): NpCommunicationId {
    return this.meta.npCommunicationId;
  }
  get platform(): string {
    return this.meta.platform;
  }
  get iconUrl(): string {
    return this.meta.iconUrl;
  }

  /**
   * List trophy groups (base game + DLCs) defined by this title, with
   * the user's earned counts and per-group progress merged in.
   *
   * Upstream PSN exposes group definitions and per-user group earnings
   * as two separate endpoints; this method calls both in parallel and
   * zips the result.
   */
  async groups(): Promise<TrophyGroup[]> {
    const npServiceName = this.platform === 'PS5' ? 'trophy2' : 'trophy';
    const [defs, earned] = await Promise.all([
      this.http.request<RawGroupsResponse>(
        `${TROPHY_BASE}/npCommunicationIds/${this.meta.npCommunicationId}/trophyGroups`,
      ),
      this.http.request<RawGroupEarningsResponse>(
        `${TROPHY_BASE}/users/${this.accountId}/npCommunicationIds/${this.meta.npCommunicationId}/trophyGroups?npServiceName=${npServiceName}`,
      ),
    ]);

    const earnedById = new Map(
      earned.trophyGroups.map((g) => [g.trophyGroupId, g]),
    );
    const zeroCounts: TrophyCounts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };

    return defs.trophyGroups.map((g) => {
      const e = earnedById.get(g.trophyGroupId);
      const group: TrophyGroup = {
        groupId: g.trophyGroupId,
        name: g.trophyGroupName,
        iconUrl: g.trophyGroupIconUrl,
        defined: g.definedTrophies,
        earned: e?.earnedTrophies ?? zeroCounts,
        progress: e?.progress ?? 0,
      };
      if (e?.lastUpdatedDateTime !== undefined) {
        group.lastUpdatedAt = e.lastUpdatedDateTime;
      }
      return group;
    });
  }

  /**
   * Fetch trophies for a group, with the user's earned status, earned
   * date, and rarity merged into each {@link Trophy} record.
   *
   * Upstream PSN exposes definitions and earnings as two separate
   * endpoints; this method calls both in parallel and zips the result.
   *
   * @param groupId — `'all'` (default) for every group, or a specific
   *   group ID from {@link TrophyTitleHandle.groups}.
   * @example
   * const trophies = await title.earned();
   * console.log(`${trophies.filter(t => t.earned).length}/${trophies.length}`);
   */
  async earned(groupId: string = 'all'): Promise<Trophy[]> {
    const [defs, earned] = await Promise.all([
      this.http.request<RawTrophiesResponse>(
        `${TROPHY_BASE}/npCommunicationIds/${this.meta.npCommunicationId}/trophyGroups/${groupId}/trophies`,
      ),
      this.http.request<RawEarnedResponse>(
        `${TROPHY_BASE}/users/${this.accountId}/npCommunicationIds/${this.meta.npCommunicationId}/trophyGroups/${groupId}/trophies`,
      ),
    ]);

    const earnedById = new Map(earned.trophies.map((e) => [e.trophyId, e]));

    return defs.trophies.map((d) => {
      const e = earnedById.get(d.trophyId);
      const rate = e?.trophyEarnedRate;
      const trophy: Trophy = {
        trophyId: d.trophyId,
        hidden: d.trophyHidden,
        type: d.trophyType,
        name: d.trophyName,
        detail: d.trophyDetail,
        iconUrl: d.trophyIconUrl,
        groupId: d.trophyGroupId,
        earned: e?.earned ?? false,
      };
      if (e?.earnedDateTime !== undefined) trophy.earnedAt = e.earnedDateTime;
      if (rate !== undefined) {
        const n = Number(rate);
        if (Number.isFinite(n)) trophy.rarity = n;
      }
      return trophy;
    });
  }

  /**
   * Aggregate earned/total counts and progress percentage for this title.
   *
   * If the handle came from {@link UserHandle.trophyTitles}, the
   * counts are already cached and no network call is made.
   */
  async summary(): Promise<TrophySummary> {
    if (this.meta.earned && this.meta.defined && this.meta.progress !== undefined) {
      return summaryFromCounts(this.meta.earned, this.meta.defined, this.meta.progress);
    }
    const raw = await this.http.request<RawSummaryResponse>(
      `${TROPHY_BASE}/users/${this.accountId}/trophyTitles?npTitleIds=${this.meta.npCommunicationId}`,
    );
    const t = raw.trophyTitles[0];
    if (!t) {
      throw new PSNError(
        `No trophy summary for ${this.meta.npCommunicationId}`,
      );
    }
    return summaryFromCounts(t.earnedTrophies, t.definedTrophies, t.progress);
  }
}
