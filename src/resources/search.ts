import type { Http } from '../http';
import type { AccountId, OnlineId } from '../types';
import { UserHandle } from './users';

const SEARCH_URL =
  'https://m.np.playstation.com/api/search/v1/universalSearch';

/**
 * A user as returned by {@link SearchResource.users} — extracted from the
 * `SocialAllAccounts` domain of PSN's universal search.
 */
export type SearchUserResult = {
  accountId: AccountId;
  onlineId: OnlineId;
  avatarUrl: string;
  /** Two-letter country code, e.g. `US`. */
  country: string;
  /** ISO language code, e.g. `en`. */
  language: string;
  isPsPlus: boolean;
  /** Whether the account is a verified-celebrity / officially verified PSN account. */
  isOfficiallyVerified: boolean;
  /** Verified display name when {@link isOfficiallyVerified} is true. */
  verifiedUserName: string;
};

/**
 * Domains supported by PSN's universal search. The most useful is
 * `SocialAllAccounts` for finding users.
 */
export type SearchDomain =
  | 'SocialAllAccounts'
  | 'ConceptGameMobileApp'
  | 'ConceptGameStore'
  | (string & {});

type RawSearchResponse = {
  domainResponses: Array<{
    domain: SearchDomain;
    results: Array<{
      id: string;
      type: string;
      score: number;
      socialMetadata?: {
        accountId: string;
        country: string;
        language: string;
        onlineId: string;
        isPsPlus: boolean;
        isOfficiallyVerified: boolean;
        avatarUrl: string;
        verifiedUserName: string;
      };
    }>;
  }>;
};

/**
 * PSN universal search.
 */
export class SearchResource {
  constructor(private readonly http: Http) {}

  /**
   * Search for PSN users by name. Returns lightweight result records;
   * promote any of them to a {@link UserHandle} via
   * {@link SearchResource.userHandle}.
   *
   * @example
   * const results = await psn.search.users('imlunahey');
   * const luna = psn.search.userHandle(results[0]);
   * const profile = await luna.profile();
   */
  async users(query: string): Promise<SearchUserResult[]> {
    const raw = await this.universal(query, ['SocialAllAccounts']);
    const domain = raw.domainResponses.find(
      (d) => d.domain === 'SocialAllAccounts',
    );
    if (!domain) return [];
    return domain.results
      .map((r) => r.socialMetadata)
      .filter((m): m is NonNullable<typeof m> => m !== undefined)
      .map((m) => ({
        accountId: m.accountId,
        onlineId: m.onlineId,
        avatarUrl: m.avatarUrl,
        country: m.country,
        language: m.language,
        isPsPlus: m.isPsPlus,
        isOfficiallyVerified: m.isOfficiallyVerified,
        verifiedUserName: m.verifiedUserName,
      }));
  }

  /**
   * Promote a {@link SearchUserResult} to a {@link UserHandle} for
   * further calls (profile, presence, trophies, etc.) without a second
   * lookup round-trip.
   */
  userHandle(result: SearchUserResult): UserHandle {
    return new UserHandle(this.http, result.accountId, result.onlineId);
  }

  /**
   * Raw universal search across one or more domains. Use this when you
   * need to search non-user domains or want the unmassaged response.
   */
  async universal(
    query: string,
    domains: SearchDomain[],
  ): Promise<RawSearchResponse> {
    return this.http.request<RawSearchResponse>(SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchTerm: query,
        domainRequests: domains.map((domain) => ({ domain })),
      }),
    });
  }
}
