import { CachedChallenge, ChallengeCache } from "./Types/ChallengeCache";

/**
 * A memory cache that can be used to store pending challenges. This will not work
 * in a distributed system.
 */
export class LocalChallengeCache implements ChallengeCache {
  private readonly challengeMap = new Map<string, CachedChallenge>();
  private readonly clearTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * @param ttlMs The number of milliseconds to keep the challenge in cache
   * @default 120000
   */
  constructor(private readonly ttlMs = 120000) {}

  /**
   * @param key The key to retrieve
   * @return The cached challenge or null if the key is expired or does not exist
   */
  get(key: string): CachedChallenge | null {
    const challenge = this.challengeMap.get(key);
    if (!challenge) {
      return null;
    }

    this.challengeMap.delete(key);
    this.clearTimeouts.delete(key);

    if (Date.now() - challenge.requestDateTime.getTime() > this.ttlMs) {
      return null;
    }

    return challenge;
  }

  /**
   * @param key The key to save
   * @param value The value to save
   */
  set(key: string, value: CachedChallenge): void {
    if (this.clearTimeouts.has(key)) {
      this.clearTimeouts.delete(key);
    }

    this.challengeMap.set(key, value);

    const timeout = setTimeout(() => {
      this.challengeMap.delete(key);
      this.clearTimeouts.delete(key);
    }, this.ttlMs);

    this.clearTimeouts.set(key, timeout);
  }
}
