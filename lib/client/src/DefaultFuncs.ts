import { constants } from "crypto";
import { IncomingMessage } from "http";
import { RequestOptions } from "https";
import {
  ClientSignedMessage,
  ExtractServerChallengeFunc,
  MutualAuthOptions,
  RequestData,
  RequestSignedMessageFunc,
} from "./Types";

interface SignedMessage {
  message: string;
  signature: string;
}

interface MutualResponse {
  clientRequested: SignedMessage;
  serverRequested: SignedMessage;
}

export function formatAsBase64Json(messageField: string): RequestSignedMessageFunc {
  return (message: ClientSignedMessage, baseOptions: RequestOptions): RequestData => {
    const options = {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      ...baseOptions,
    };
    const body = Buffer.from(
      JSON.stringify({
        userId: message.userId,
        [messageField]: {
          message: message.data.message.toString("base64"),
          signature: message.data.signature.toString("base64"),
        },
      })
    );
    return { options, body };
  };
}

export function extractByBase64Json(): ExtractServerChallengeFunc {
  return (response: IncomingMessage, body: Buffer) => {
    const bodyObj = JSON.parse(body.toString()) as MutualResponse;

    return {
      clientRequested: {
        message: Buffer.from(bodyObj.clientRequested.message, "base64"),
        signature: Buffer.from(bodyObj.clientRequested.signature, "base64"),
      },
      serverRequested: {
        message: Buffer.from(bodyObj.serverRequested.message, "base64"),
        signature: Buffer.from(bodyObj.serverRequested.signature, "base64"),
      },
    };
  };
}

/**
 * @return The default values for MutualKeyChallengeOptions
 */
export function getDefaultOptions(): MutualAuthOptions {
  return {
    formatChallengeFunc: formatAsBase64Json("challenge"),
    extractResponseFunc: extractByBase64Json(),
    formatResponseFunc: formatAsBase64Json("response"),
    cryptography: {
      hashAlgorithm: "sha256",
      messagePadding: constants.RSA_PKCS1_OAEP_PADDING,
      signVerifyPadding: constants.RSA_PKCS1_PADDING,
      nonceSize: 128,
    },
  };
}
