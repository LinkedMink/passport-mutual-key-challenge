import { constants, KeyLike } from "crypto";
import { LocalChallengeCache } from "./LocalChallengeCache";
import { challengeByBase64Header } from "./RequestFuncs";
import { ChallengeCache } from "./Types/ChallengeCache";
import { GetClientChallengeOrResponseFunc, GetServerKeyFunc, GetUserFunc } from "./Types/Functions";

/**
 * Options to customize how the message is encrypted and verified. The client must use the same format.
 */
export interface CryptographyOptions {
  /**
   * Padding for the encrypted/decrypted messages
   * @see https://nodejs.org/api/crypto.html#crypto_other_openssl_constants
   * @default crypto.constants.RSA_PKCS1_OAEP_PADDING
   */
  messagePadding: number;
  /**
   * Padding for signing/verifying messages
   * @see https://nodejs.org/api/crypto.html#crypto_other_openssl_constants
   * @default crypto.constants.RSA_PKCS1_PADDING
   */
  signaturePadding: number;
  /**
   * The hashing algorithm to use universally. Currently, there isn't an option to differentiate operations.
   * @default "sha256"
   */
  hashAlgorithm: string;
  /**
   * The number of bytes for the randomly generated challenge nonce
   * @default 128
   */
  nonceSize: number;
}

/**
 * Options you must supply when creating this strategy
 */
export interface MutualKeyChallengeRequiredOptions<TUser = unknown> {
  /**
   * The servers private key for signing, encrypting, and decrypting challenges. If you don't
   * want the key cached provide a function. Otherwise, the strategy will store the key in memory.
   */
  serverKey: GetServerKeyFunc | KeyLike;
  /**
   * A function to get the user's public key from the request context (user ID attached to
   * the body for example). If the server has established trust ahead of time, this
   */
  userFunc: GetUserFunc<TUser>;
}

/**
 * Options that have defaults if nothing is supplied
 */
export interface MutualKeyChallengeOptionalOptions {
  /**
   * This function extracts the server or client challenge from the incoming HTTP request
   * @default challengeByBase64Body
   */
  challengeOrResponseFunc: GetClientChallengeOrResponseFunc;
  /**
   * The data structure that will manage storing temporary server challenges
   * @default LocalChallengeCache
   */
  challengeCache: ChallengeCache;
  /**
   * Options to customize how the message is encrypted and verified. The client must use the same format.
   */
  cryptography: CryptographyOptions;
}

/**
 * Options allowed on the passport.authenticate function
 */
export type MutualKeyChallengeAuthOptions = Record<string, never>;

/**
 * All available options when creating this strategy
 */
export type MutualKeyChallengeOptions<TUser = unknown> = MutualKeyChallengeRequiredOptions<TUser> &
  Partial<MutualKeyChallengeOptionalOptions>;

/**
 * The options resolved with the default values not provided by MutualKeyChallengeOptions
 */
export type MutualKeyChallengeResolvedOptions<TUser = unknown> =
  MutualKeyChallengeRequiredOptions<TUser> & MutualKeyChallengeOptionalOptions;

/**
 * @return The default values for MutualKeyChallengeOptions
 */
export function getDefaultOptions(): MutualKeyChallengeOptionalOptions {
  return {
    challengeOrResponseFunc: challengeByBase64Header(),
    challengeCache: new LocalChallengeCache(120 * 1000),
    cryptography: {
      hashAlgorithm: "sha256",
      messagePadding: constants.RSA_PKCS1_OAEP_PADDING,
      signaturePadding: constants.RSA_PKCS1_PADDING,
      nonceSize: 128,
    },
  };
}
