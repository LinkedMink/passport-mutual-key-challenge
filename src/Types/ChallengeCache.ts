/**
 * A challenge issued by the server
 */
export interface CachedChallenge {
  /**
   * A key that can uniquely identify the user
   */
  userId: string;
  /**
   * The decrypted challenge nonce issued by tbe server
   */
  clientChallenged: Buffer;
  /**
   * The DateTime the request occurred
   */
  requestDateTime: Date;
}

/**
 * A cache of challenges that allows only getting the key once per set()
 */
export interface ChallengeCache {
  /**
   * @param key The key to retrieve
   * @return The cached challenge or null if the key is expired or does not exist
   */
  get(key: string): CachedChallenge | null;
  /**
   * @param key The key to save
   * @param value The value to save
   */
  set(key: string, value: CachedChallenge): void;
}
