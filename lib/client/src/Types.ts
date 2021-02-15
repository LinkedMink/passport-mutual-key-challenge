import { IncomingMessage, RequestOptions } from "http";

export interface RequestData {
  options: RequestOptions;
  body?: Buffer;
}

/**
 * A challenge message that has been signed
 */
export interface SignedMessage {
  /**
   * The challenge nonce message in either the encrypted or unencrypted form depending
   * on stage and recipient party.
   */
  message: Buffer;
  /**
   * A signature of SignedMessage.message in the unecrypted form
   */
  signature: Buffer;
}

/**
 *
 */
export interface ClientSignedMessage {
  /**
   * A key that can uniquely identify the user
   */
  userId: string;
  /**
   * A signed message sent by the client
   */
  data: SignedMessage;
}

/**
 * If a user is found in the client challenge stage, the callback in passport.authenticate will
 * have this as the third parameter. The raw bytes can then be converted to the transfer encoding.
 */
export interface ServerChallenge {
  clientRequested: SignedMessage;
  serverRequested: SignedMessage;
}

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
  signVerifyPadding: number;
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

export interface HandshakeRequestOptions {
  host: string
  port?: number
  path?: string
  isSslRequest: boolean
}

export type RequestSignedMessageFunc = (
  message: ClientSignedMessage,
  baseOptions: RequestOptions
) => RequestData;
export type ExtractServerChallengeFunc = (
  response: IncomingMessage,
  body: Buffer
) => ServerChallenge;

export interface MutualAuthOptions {
  formatChallengeFunc: RequestSignedMessageFunc;
  extractResponseFunc: ExtractServerChallengeFunc;
  formatResponseFunc: RequestSignedMessageFunc;
  /**
   * Options to customize how the message is encrypted and verified. The client must use the same format.
   */
  cryptography: CryptographyOptions;
}
