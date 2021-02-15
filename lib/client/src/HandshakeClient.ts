import crypto, { KeyLike, KeyObject } from "crypto";
import http, { IncomingMessage } from "http";
import https from "https";
import { getDefaultOptions } from "./DefaultFuncs";
import { isKeyObject } from "./TypeCheck";
import { CryptographyOptions, HandshakeRequestOptions, MutualAuthOptions, RequestData, ServerChallenge } from "./Types";

export class HandshakeClient {
  private readonly options: MutualAuthOptions;
  private readonly cryptOpt: CryptographyOptions;

  constructor(options?: Partial<MutualAuthOptions>) {
    this.options = {
      ...getDefaultOptions(),
      ...options,
    };
    this.cryptOpt = this.options.cryptography;
  }

  request = async (
    requestOptions: HandshakeRequestOptions,
    userId: string,
    clientKey: KeyLike,
    serverKey: KeyLike
  ): Promise<Buffer> => {

    const clientKeyObj = isKeyObject(clientKey) ? clientKey : crypto.createPrivateKey(clientKey);
    const serverKeyObj = isKeyObject(serverKey) ? serverKey : crypto.createPublicKey(serverKey);

    const nonce = crypto.randomBytes(this.options.cryptography.nonceSize);
    const challengeRequest = this.options.formatChallengeFunc(
      {
        userId,
        data: {
          message: crypto.publicEncrypt(this.messageOpts(serverKeyObj), nonce),
          signature: crypto.sign(
            this.cryptOpt.hashAlgorithm,
            nonce,
            this.signVerifyOpts(clientKeyObj)
          ),
        },
      },
      requestOptions
    );

    const serverChallengeData = await this.getRequestPromise(
      challengeRequest,
      requestOptions.isSslRequest,
      this.options.extractResponseFunc
    );
    const serverChallenge = serverChallengeData as ServerChallenge;

    const isClientReqVerified = crypto.verify(
      this.cryptOpt.hashAlgorithm,
      serverChallenge.clientRequested.message,
      this.signVerifyOpts(serverKeyObj),
      serverChallenge.clientRequested.signature
    );

    if (!serverChallenge.clientRequested.message.equals(nonce) || !isClientReqVerified) {
      throw new Error("Failed to verify client challenge");
    }

    const responseMessage = crypto.privateDecrypt(
      this.messageOpts(clientKeyObj),
      serverChallenge.serverRequested.message
    );
    const isServerReqVerified = crypto.verify(
      this.cryptOpt.hashAlgorithm,
      responseMessage,
      this.signVerifyOpts(serverKeyObj),
      serverChallenge.serverRequested.signature
    );

    if (!isServerReqVerified) {
      throw new Error("Failed to verify server challenge");
    }

    const responseRequest = this.options.formatResponseFunc(
      {
        userId,
        data: {
          message: responseMessage,
          signature: crypto.sign(
            this.cryptOpt.hashAlgorithm,
            responseMessage,
            this.signVerifyOpts(clientKeyObj)
          ),
        },
      },
      requestOptions
    );

    const serverResult = await this.getRequestPromise(responseRequest, requestOptions.isSslRequest);

    return serverResult as Buffer;
  };

  private getRequestPromise<TResult>(
    data: RequestData,
    isSslRequest?: boolean,
    extractFunc?: (res: IncomingMessage, body: Buffer) => TResult
  ) {
    const client = isSslRequest ? https : http
    return new Promise<TResult | Buffer>((resolve, reject) => {
      const request = client.request(data.options, response => {
        const data: Buffer[] = [];
        response.on("data", (chunk: Buffer) => {
          data.push(chunk);
        });

        response.on("end", () => {
          const combined = Buffer.concat(data);
          resolve(extractFunc ? extractFunc(response, combined) : combined);
        });
      });

      request.on("error", err => {
        reject(err);
      });

      request.end(data.body);
    });
  }

  private messageOpts = (key: KeyObject) => {
    return {
      key,
      padding: this.cryptOpt.messagePadding,
      oaepHash: this.cryptOpt.hashAlgorithm,
    };
  };

  private signVerifyOpts = (key: KeyObject) => {
    return { key, padding: this.cryptOpt.signVerifyPadding };
  };
}
