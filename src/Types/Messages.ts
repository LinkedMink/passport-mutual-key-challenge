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
 * When an incoming request comes in, the client's challenge is parsed into this initial form\
 * to be processed
 */
export interface ClientChallenge {
  /**
   * A key that can uniquely identify the user
   */
  userId: string;
  /**
   * A signed challenge sent by the client to open a authentication request
   */
  clientRequested: SignedMessage;
  /**
   * The DateTime the request occurred
   */
  requestDateTime: Date;
}

/**
 * When an incoming request comes in, the client's response is parsed into this initial form
 * to be processed
 */
export interface ClientResponse {
  /**
   * A key that can uniquely identify the user
   */
  userId: string;
  /**
   * A signed message sent by the client with the decrypted challenge nonce issued by tbe server
   */
  clientResponsed: SignedMessage;
}

/**
 * If a user is found in the client challenge stage, the callback in passport.authenticate will
 * have this as the third parameter. The raw bytes can then be converted to the transfer encoding.
 */
export interface ServerChallenge {
  clientRequested: SignedMessage;
  serverRequested: SignedMessage;
}
