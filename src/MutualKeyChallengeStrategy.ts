import { IncomingMessage } from "http";
import { Strategy } from "passport-strategy";
import { getDefaultOptions } from "./Functions";
import { MessageVerifier } from "./MessageVerifier";
import { MutualKeyChallengeAuthOptions, MutualKeyChallengeOptions } from "./Options";
import { isPromise } from "./TypeCheck";
import {
  CachedChallenge,
  Challenge,
  ChallengeError,
  ChallengeOrResponse,
  ChallengeResponse,
  ChallengeStage,
  ClientChallenge,
} from "./Types";

export class MutualKeyChallengeStrategy<T = unknown> extends Strategy {
  private readonly options: MutualKeyChallengeOptions<T>;
  private readonly challengeCache = new Map<string, CachedChallenge[]>();
  private readonly message: MessageVerifier;

  constructor(options: MutualKeyChallengeOptions<T>) {
    super();
    this.options = {
      ...getDefaultOptions(),
      ...options,
    } as MutualKeyChallengeOptions<T>;
    this.message = new MessageVerifier(options.serverKey, options.encrypt);
  }

  async authenticate(req: IncomingMessage, options?: MutualKeyChallengeAuthOptions): Promise<void> {
    const request = this.options.challengeOrResponseFunc(req);
    if (ChallengeError.isType(request)) {
      return this.error(request);
    }

    if (this.isChallengeResponse(request)) {
      return this.handleChallengeResponse(req, request);
    }

    return this.handleChallengeRequest(req, request);
  }

  private handleChallengeResponse = async (req: IncomingMessage, message: ChallengeResponse) => {
    const user = await this.getUserResult(req, message.key);
    if (ChallengeError.isType(user)) {
      return this.error(user);
    }

    const decrypted = await this.message.decryptAndVerify(message.key, message.clientResponsed);
    if (!decrypted) {
      return this.error(
        new ChallengeError("The response could not be verified", ChallengeStage.ServerChallenge)
      );
    }

    const keyHash = this.message.hash(message.key);
    const bucket = this.challengeCache.get(keyHash);
    if (!bucket) {
      return this.error(
        new ChallengeError("Challenge is expired or not initiated", ChallengeStage.ServerChallenge)
      );
    }

    const cIndex = bucket.findIndex(c => c.key.equals(message.key));
    if (cIndex < 0) {
      return this.error(
        new ChallengeError("Challenge is expired or not initiated", ChallengeStage.ServerChallenge)
      );
    }

    const challenge = bucket.splice(cIndex, 1)[0];
    if (bucket.length <= 0) {
      this.challengeCache.delete(keyHash);
    }

    if (
      Date.now() - challenge.requestDateTime.getTime() <
      this.options.expireChallengeInSec * 1000
    ) {
      return this.error(
        new ChallengeError("Challenge is expired or not initiated", ChallengeStage.ServerChallenge)
      );
    }

    this.success(user, message.key);
  };

  private handleChallengeRequest = async (req: IncomingMessage, message: Challenge) => {
    const user = await this.getUserResult(req, message.key);
    if (ChallengeError.isType(user)) {
      return this.error(user);
    }

    const decrypted = await this.message.decryptAndVerify(message.key, message.clientRequested);
    if (!decrypted) {
      return this.error(
        new ChallengeError("The response could not be verified", ChallengeStage.ServerChallenge)
      );
    }

    const decryptedMessage = await this.message.sign(decrypted);

    const nonce = this.message.getNonce();
    const nonceMessage = await this.message.encryptAndSign(message.key, nonce);

    const challenge = {
      clientRequested: decryptedMessage,
      serverRequested: nonceMessage,
    } as ClientChallenge;

    this.fail(challenge, 401);
  };

  private getUserResult = async (
    req: IncomingMessage,
    key: Buffer
  ): Promise<T | ChallengeError> => {
    const userResult = this.options.userFunc(req, key);
    if (!userResult) {
      return new ChallengeError("No user could be found", ChallengeStage.ServerChallenge);
    }

    const user = isPromise(userResult) ? await userResult : userResult;
    if (!user) {
      return new ChallengeError("No user could be found", ChallengeStage.ServerChallenge);
    }

    return user;
  };

  private isChallengeResponse = (value: ChallengeOrResponse): value is ChallengeResponse =>
    (value as ChallengeResponse).clientResponsed !== undefined;
}
