import { IncomingMessage } from "http";

export interface EncryptOptions {
  messagePadding: number;
  signaturePadding: number;
  hashAlgorithm: string;
}

export interface SignedMessage {
  message: Buffer;
  signature: Buffer;
}

export interface Challenge {
  key: Buffer;
  clientRequested: SignedMessage;
  requestDateTime: Date;
}

export interface ChallengeResponse {
  key: Buffer;
  clientResponsed: SignedMessage;
}

export type ChallengeOrResponse = Challenge | ChallengeResponse;

export interface ClientChallenge {
  clientRequested: SignedMessage;
  serverRequested: SignedMessage;
}

export interface CachedChallenge {
  key: Buffer;
  clientChallenged: Buffer;
  requestDateTime: Date;
}

export type InMemoryKey = Buffer | string;
export type GetServerKeyFunc = () => InMemoryKey | Promise<InMemoryKey>;
export type GetUserByPublicKeyFunc<T> = (
  req: IncomingMessage,
  key: Buffer
) => T | null | Promise<T | null>;
export type GetChallengeOrResponseFunc = (
  req: IncomingMessage
) => ChallengeOrResponse | ChallengeError;

export enum ChallengeStage {
  None,
  ClientChallenge,
  ServerChallenge,
}

export class ChallengeError extends Error {
  constructor(message?: string, public readonly stage = ChallengeStage.None) {
    super(message);
    Object.setPrototypeOf(this, ChallengeError.prototype);
  }

  static isType(value: unknown): value is ChallengeError {
    return value instanceof Error && (value as ChallengeError).stage !== undefined;
  }
}
