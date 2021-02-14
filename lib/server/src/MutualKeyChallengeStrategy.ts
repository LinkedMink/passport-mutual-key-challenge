import { IncomingMessage } from "http";
import { Strategy } from "passport-strategy";
import { MessageVerifier } from "./MessageVerifier";
import {
  getDefaultOptions,
  MutualKeyChallengeAuthOptions,
  MutualKeyChallengeOptions,
  MutualKeyChallengeResolvedOptions,
} from "./MutualKeyChallengeOptions";
import { isClientResponse, isPromise } from "./Helpers/TypeCheck";
import { ClientChallenge, ClientResponse, ServerChallenge } from "./Types/Messages";
import { ChallengeError, ChallengeStage } from "./Types";
import { UserKeyRecord } from "./Types/Functions";

export class MutualKeyChallengeStrategy<T = unknown> extends Strategy {
  private readonly options: MutualKeyChallengeResolvedOptions<T>;
  private readonly verifier: MessageVerifier;

  constructor(options: MutualKeyChallengeOptions<T>) {
    super();

    this.options = {
      ...getDefaultOptions(),
      ...options,
    } as MutualKeyChallengeResolvedOptions<T>;
    this.verifier = new MessageVerifier(this.options.serverKey, this.options.cryptography);
  }

  async authenticate(req: IncomingMessage, options?: MutualKeyChallengeAuthOptions): Promise<void> {
    const request = this.options.challengeOrResponseFunc(req);
    if (ChallengeError.isType(request)) {
      return this.error(request);
    }

    if (isClientResponse(request)) {
      return this.handleChallengeResponse(req, request);
    }

    return this.handleChallengeRequest(req, request);
  }

  private async handleChallengeResponse(req: IncomingMessage, message: ClientResponse) {
    const user = await this.getUserResult(req, message.userId);
    if (ChallengeError.isType(user)) {
      return this.error(user);
    }

    if (!(await this.verifier.verify(user.publicKey, message.clientResponsed))) {
      return this.error(
        new ChallengeError("The response could not be verified", ChallengeStage.ServerChallenge)
      );
    }

    const challengeGet = this.options.challengeCache.get(message.userId);
    const challenge = isPromise(challengeGet) ? await challengeGet : challengeGet;
    if (!challenge) {
      return this.error(
        new ChallengeError("Challenge is not initiated or expired", ChallengeStage.ServerChallenge)
      );
    }

    if (!challenge.clientChallenged.equals(message.clientResponsed.message)) {
      return this.error(
        new ChallengeError("Challenge is incorrect", ChallengeStage.ServerChallenge)
      );
    }

    this.success(user.user, user.publicKey);
  }

  private async handleChallengeRequest(req: IncomingMessage, message: ClientChallenge) {
    const user = await this.getUserResult(req, message.userId);
    if (ChallengeError.isType(user)) {
      return this.error(user);
    }

    const decrypted = await this.verifier.decryptAndVerify(user.publicKey, message.clientRequested);
    if (!decrypted) {
      return this.error(
        new ChallengeError("The response could not be verified", ChallengeStage.ServerChallenge)
      );
    }

    const decryptedMessage = await this.verifier.sign(decrypted);

    const nonce = this.verifier.getNonce();
    const nonceMessage = await this.verifier.encryptAndSign(user.publicKey, nonce);

    const challengeSet = this.options.challengeCache.set(message.userId, {
      userId: message.userId,
      clientChallenged: nonce,
      requestDateTime: message.requestDateTime,
    });
    if (isPromise(challengeSet)) {
      await challengeSet;
    }

    const challenge = {
      clientRequested: decryptedMessage,
      serverRequested: nonceMessage,
    } as ServerChallenge;

    this.fail(challenge, 401);
  }

  private async getUserResult(
    req: IncomingMessage,
    userId: string
  ): Promise<UserKeyRecord<T> | ChallengeError> {
    const userResult = this.options.userFunc(req, userId);
    if (!userResult) {
      return new ChallengeError("No user could be found", ChallengeStage.ServerChallenge);
    }

    const user = isPromise(userResult) ? await userResult : userResult;
    if (!user) {
      return new ChallengeError("No user could be found", ChallengeStage.ServerChallenge);
    }

    return user;
  }
}
