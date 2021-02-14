/**
 * If the error has occured when the client challenges the server or when the server verifies
 * the client's response (or None for unspecified)
 */
export enum ChallengeStage {
  None,
  ClientChallenge,
  ServerChallenge,
}

/**
 * An error that happens in the MutualKeyChallengeStrategy. It will be the first parameter for
 * the callback to passport.authenticate unless an unexpected exception is thrown.
 */
export class ChallengeError extends Error {
  constructor(message?: string, public readonly stage = ChallengeStage.None) {
    super(message);
    Object.setPrototypeOf(this, ChallengeError.prototype);
  }

  /**
   * @param value The value to check
   * @return If the input's type is ChallengeError
   */
  static isType(value: unknown): value is ChallengeError {
    return value instanceof Error && (value as ChallengeError).stage !== undefined;
  }
}
