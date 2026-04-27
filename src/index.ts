export { PSN } from './client';
export type { PSNOptions } from './client';
export {
  PSNError,
  NotFound,
  RateLimited,
  AuthExpired,
  AuthInvalid,
} from './errors';
export type {
  AccountId,
  OnlineId,
  NpCommunicationId,
  Platform,
  TrophyKind,
  TrophyCounts,
  Tokens,
  Profile,
  Presence,
  ListOpts,
} from './types';
export type { TokenChangeListener } from './http';
export type {
  UserHandle,
  MeHandle,
  UsersResource,
  TrophiesNamespace,
  TrophyStats,
  TrophyProgress,
  ShareableProfileLink,
  Device,
  FriendRequest,
} from './resources/users';
export type {
  TrophyTitleHandle,
  TrophyTitleMeta,
  TrophyGroup,
  Trophy,
  TrophySummary,
} from './resources/trophies';
export type {
  PlayedGame,
  RecentlyPlayedGame,
  PurchasedGame,
  RecentlyPlayedOpts,
  PurchasedGamesOpts,
} from './resources/games';
export type {
  SearchResource,
  SearchUserResult,
  SearchDomain,
} from './resources/search';
export type { Listable, Page, PageFetcher } from './pagination';
