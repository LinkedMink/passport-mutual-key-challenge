import { IncomingMessage } from "http";
import { Strategy } from "passport-strategy";
import { getDefaultOptions } from "./Functions";
import { MessageVerifier } from "./MessageVerifier";
import { MutualKeyChallengeAuthOptions, MutualKeyChallengeOptions } from "./Options";
import { isChallengeResponse, isPromise } from "./TypeCheck";
import {
  CachedChallenge,
  Challenge,
  ChallengeError,
  ChallengeResponse,
  ChallengeStage,
  ClientChallenge,
} from "./Types";

export class MutualKeyChallengeStrategy<T = unknown> extends Strategy {
  private readonly options: MutualKeyChallengeOptions<T>;
  private readonly challengeCache = new Map<string, CachedChallenge[]>();
  private readonly verifier: MessageVerifier;
  private readonly cacheTtlMs: number;

  constructor(options: MutualKeyChallengeOptions<T>) {
    super();
    
    this.options = {
      ...getDefaultOptions(),
      ...options,
    } as MutualKeyChallengeOptions<T>;
    this.verifier = new MessageVerifier(options.serverKey, options.encrypt);
    this.cacheTtlMs = this.options.expireChallengeInSec * 1000;
  }

  async authenticate(req: IncomingMessage, options?: MutualKeyChallengeAuthOptions): Promise<void> {
    const request = this.options.challengeOrResponseFunc(req);
    if (ChallengeError.isType(request)) {
      return this.error(request);
    }

    if (isChallengeResponse(request)) {
      return this.handleChallengeResponse(req, request);
    }

    return this.handleChallengeRequest(req, request);
  }

  private async handleChallengeResponse(req: IncomingMessage, message: ChallengeResponse) {
    const user = await this.getUserResult(req, message.key);
    if (ChallengeError.isType(user)) {
      return this.error(user);
    }

    if (!await this.verifier.verify(message.key, message.clientResponsed)) {
      return this.error(
        new ChallengeError("The response could not be verified", ChallengeStage.ServerChallenge)
      );
    }

    const keyHash = this.verifier.hash(message.key);
    const bucket = this.challengeCache.get(keyHash);
    if (!bucket) {
      return this.error(
        new ChallengeError("Challenge is not initiated", ChallengeStage.ServerChallenge)
      );
    }

    const cIndex = bucket.findIndex(c => c.key.equals(message.key));
    if (cIndex < 0) {
      return this.error(
        new ChallengeError("Challenge is not initiated", ChallengeStage.ServerChallenge)
      );
    }

    const challenge = bucket.splice(cIndex, 1)[0];
    if (bucket.length <= 0) {
      this.challengeCache.delete(keyHash);
    }

    if (Date.now() - challenge.requestDateTime.getTime() > this.cacheTtlMs) {
      return this.error(
        new ChallengeError("Challenge is expired", ChallengeStage.ServerChallenge)
      );
    }

    if (!challenge.clientChallenged.equals(message.clientResponsed.message)) {
      return this.error(
        new ChallengeError("Challenge is incorrect", ChallengeStage.ServerChallenge)
      );
    }

    this.success(user, message.key);
  };

  private async handleChallengeRequest(req: IncomingMessage, message: Challenge) {
    const user = await this.getUserResult(req, message.key);
    if (ChallengeError.isType(user)) {
      return this.error(user);
    }

    const decrypted = await this.verifier.decryptAndVerify(message.key, message.clientRequested);
    if (!decrypted) {
      return this.error(
        new ChallengeError("The response could not be verified", ChallengeStage.ServerChallenge)
      );
    }

    const decryptedMessage = await this.verifier.sign(decrypted);

    const nonce = this.verifier.getNonce();
    const nonceMessage = await this.verifier.encryptAndSign(message.key, nonce);

    const keyHash = this.verifier.hash(message.key);
    this.challengeCache.set(keyHash, [{ 
      key: message.key,
      clientChallenged: nonce,
      requestDateTime: message.requestDateTime
    }])

    const challenge = {
      clientRequested: decryptedMessage,
      serverRequested: nonceMessage,
    } as ClientChallenge;

    this.fail(challenge, 401);
  };

  private async getUserResult(
    req: IncomingMessage,
    key: Buffer
  ): Promise<T | ChallengeError> {
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
}
