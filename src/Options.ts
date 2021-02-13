import {
  GetUserByPublicKeyFunc,
  GetServerKeyFunc,
  InMemoryKey,
  GetChallengeOrResponseFunc,
  EncryptOptions,
} from "./Types";

export interface MutualKeyChallengeRequiredOptions<T = unknown> {
  /**
   * The servers private key for signing, encrypting, and decrypting challenges
   */
  serverKey: GetServerKeyFunc | InMemoryKey;
  /**
   * A function to get the user's public key from the request context (user ID attached to
   * the body for example). If the server has established trust ahead of time, this
   */
  userFunc: GetUserByPublicKeyFunc<T>;
}

export interface MutualKeyChallengeOptionalOptions {
  expireChallengeInSec: number;
  challengeOrResponseFunc: GetChallengeOrResponseFunc;
  encrypt: EncryptOptions;
}

export type MutualKeyChallengeAuthOptions = Record<string, never>;

export type MutualKeyChallengeOptions<T = unknown> = MutualKeyChallengeRequiredOptions<T> &
  MutualKeyChallengeOptionalOptions;
