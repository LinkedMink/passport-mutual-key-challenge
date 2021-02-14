import { KeyLike } from "crypto";
import { IncomingMessage } from "http";
import { ChallengeError } from ".";
import { ClientChallenge, ClientResponse } from "./Messages";

/**
 * A user with their stored, preverified public key
 */
export interface UserKeyRecord<TUser = unknown> {
  /**
   * The user that will be the second parameter of the passport.authenticate callback
   * when authentication succeeds
   */
  user: TUser;
  /**
   * If a string or buffer, the key type will be assumed from crypto.createPublicKey
   */
  publicKey: KeyLike;
}

/**
 * A function to retrieve the server's private key.
 * @return The servers private key
 */
export type GetServerKeyFunc = () => KeyLike | Promise<KeyLike>;

/**
 * @param req: The HTTP request from the client
 * @param userId: A key that can find the user passed from the IncomingMessage
 * @return The user and their public key if they exist or null if they don't
 */
export type GetUserFunc<T = unknown> = (
  req: IncomingMessage,
  userId: string
) => UserKeyRecord<T> | null | Promise<UserKeyRecord<T> | null>;

/**
 * A function that extracts the public/private key challenge/response from the  HTTP request
 * @param req: The HTTP request from the client
 * @return If ClientChallenge, the strategy will return a challenge to the client with the
 * decrypted client challenge. If ClientResponse, the strategy will verify the client's response
 * and call success for the passport.authenticate callback to consume the user. If ChallengeError,
 * the parameters could not be extracted, so do not proceed.
 */
export type GetClientChallengeOrResponseFunc = (
  req: IncomingMessage
) => ClientChallenge | ClientResponse | ChallengeError;
