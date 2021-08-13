import { IncomingMessage } from "http";
import { ChallengeError, ChallengeStage } from "./Types/ChallengeError";
import { ClientChallenge, ClientResponse } from "./Types/Messages";
import { GetClientChallengeOrResponseFunc } from "./Types/Functions";

interface BodyIncomingMessage extends IncomingMessage {
  body: Record<string, string | SignedChallenge>;
}

interface SignedChallenge {
  message: string;
  signature: string;
}

export const challengeByBase64Body = (
  userIdProperty: "userId",
  challengeProperty: "challenge",
  responseProperty = "response"
): GetClientChallengeOrResponseFunc => {
  return (req: IncomingMessage): ClientChallenge | ClientResponse | ChallengeError => {
    const body = (req as BodyIncomingMessage).body;
    const userId = body[userIdProperty];
    if (!userId) {
      return new ChallengeError(
        `The property ${userIdProperty} does not contain the user's key`,
        ChallengeStage.ClientChallenge
      );
    }

    const challenge = body[challengeProperty];
    if (challenge) {
      const sent = challenge as SignedChallenge;
      return {
        userId: userId as string,
        clientRequested: {
          message: Buffer.from(sent.message, "base64"),
          signature: Buffer.from(sent.signature, "base64"),
        },
        requestDateTime: new Date(),
      };
    }

    const response = body[responseProperty];
    if (response) {
      const sent = response as SignedChallenge;
      return {
        userId: userId as string,
        clientResponsed: {
          message: Buffer.from(sent.message, "base64"),
          signature: Buffer.from(sent.signature, "base64"),
        },
      };
    }

    return new ChallengeError(
      `Both ${challengeProperty} and ${responseProperty} does not contain the challenge message`,
      ChallengeStage.ClientChallenge
    );
  };
};

enum KeyRegExIx {
  Full = 0,
  Value = 1,
}

enum ValueRegExIx {
  Full = 0,
  Challenge = 1,
  Response = 2,
  Message = 3,
  Signature = 4,
}

export const challengeByBase64Header = (
  keyFieldName = "uid",
  challengeFieldName = "cha",
  responseFieldName = "res"
): GetClientChallengeOrResponseFunc => {
  const MUTUAL_AUTH = "Mutual";
  const KEY_REGEX = new RegExp(`(${keyFieldName})=([A-Za-z0-9+/=]+)`, "i");
  const CHALLENGE_REGEX = new RegExp(
    `(${challengeFieldName})|(${responseFieldName})=([A-Za-z0-9+/=]+),([A-Za-z0-9+/=]+)`,
    "i"
  );

  return (req: IncomingMessage): ClientChallenge | ClientResponse | ChallengeError => {
    const authHeader = req.headers["authorization"]?.trim();
    if (!authHeader?.startsWith(MUTUAL_AUTH)) {
      return new ChallengeError(
        `Header Authorization must be type: ${MUTUAL_AUTH}`,
        ChallengeStage.ClientChallenge
      );
    }

    const keyResult = KEY_REGEX.exec(authHeader);
    if (!keyResult) {
      return new ChallengeError(
        `Header Authorization must be in the format: 'Authorization: Mutual ${keyFieldName}=[base64 key],(${challengeFieldName}|${responseFieldName})[base64 challenge],[base64 signature]'`,
        ChallengeStage.ClientChallenge
      );
    }

    const challengeResult = CHALLENGE_REGEX.exec(authHeader);
    if (!challengeResult) {
      return new ChallengeError(
        `Header Authorization must be in the format: 'Authorization: Mutual ${keyFieldName}=[base64 key],(${challengeFieldName}|${responseFieldName})[base64 challenge],[base64 signature]'`,
        ChallengeStage.ClientChallenge
      );
    }

    if (challengeResult[ValueRegExIx.Challenge]) {
      return {
        userId: keyResult[KeyRegExIx.Value],
        clientRequested: {
          message: Buffer.from(challengeResult[ValueRegExIx.Message], "base64"),
          signature: Buffer.from(challengeResult[ValueRegExIx.Signature], "base64"),
        },
        requestDateTime: new Date(),
      };
    }

    return {
      userId: keyResult[KeyRegExIx.Value],
      clientResponsed: {
        message: Buffer.from(challengeResult[ValueRegExIx.Message], "base64"),
        signature: Buffer.from(challengeResult[ValueRegExIx.Signature], "base64"),
      },
    };
  };
};
