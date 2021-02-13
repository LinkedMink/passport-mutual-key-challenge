import {
  GetUserByPublicKeyFunc,
  GetServerKeyFunc,
  InMemoryKey,
  GetChallengeOrResponseFunc,
  EncryptOptions,
} from "./Types";

/**
 * Options you must supply when creating this strategy
 */
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

/**
 * Options that have defaults if nothing is supplied
 */
export interface MutualKeyChallengeOptionalOptions {
  /**
   * How long the server will accept a response for an open challenge it has issued
   */
  expireChallengeInSec: number;
  /**
   * This function extracts the server or client challenge from the incoming HTTP request
   */
  challengeOrResponseFunc: GetChallengeOrResponseFunc;
  /**
   * Options to customize how the message is encrypted. The client must use the same format.
   */
  encrypt: EncryptOptions;
}

/**
 * Options allowed on the passport.authenticate function
 */
export type MutualKeyChallengeAuthOptions = Record<string, never>;

/**
 * All available options when creating this strategy
 */
export type MutualKeyChallengeOptions<T = unknown> = MutualKeyChallengeRequiredOptions<T> &
  MutualKeyChallengeOptionalOptions;
