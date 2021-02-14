import crypto, { BinaryLike, KeyLike, KeyObject } from "crypto";
import { CryptographyOptions } from "./MutualKeyChallengeOptions";
import { isFunction, isKeyObject, isPromise } from "./Helpers/TypeCheck";
import { SignedMessage } from "./Types/Messages";
import { GetServerKeyFunc } from "./Types/Functions";

export class MessageVerifier {
  private readonly key: KeyObject | GetServerKeyFunc;

  constructor(key: GetServerKeyFunc | KeyLike, private readonly options: CryptographyOptions) {
    if (isFunction(key)) {
      this.key = key;
    } else {
      this.key = isKeyObject(key) ? key : crypto.createPrivateKey(key);
    }
  }

  async decryptAndVerify(pubKey: KeyLike, data: SignedMessage): Promise<Buffer | null> {
    const key = await this.serverKey();
    const decrypted = crypto.privateDecrypt(this.encryptOptions(key), data.message);
    const isVerified = crypto.verify(
      this.options.hashAlgorithm,
      decrypted,
      this.verifyOptions(pubKey),
      data.signature
    );

    return isVerified ? decrypted : null;
  }

  async encryptAndSign(pubKey: KeyLike, data: Buffer): Promise<SignedMessage> {
    const key = await this.serverKey();
    const message = crypto.publicEncrypt(this.encryptOptions(pubKey), data);
    const signature = crypto.sign(this.options.hashAlgorithm, data, this.signOptions(key));

    return { message, signature };
  }

  async verify(pubKey: KeyLike, data: SignedMessage): Promise<boolean> {
    const key = await this.serverKey();
    return crypto.verify(
      this.options.hashAlgorithm,
      data.message,
      this.verifyOptions(pubKey),
      data.signature
    );
  }

  async sign(data: Buffer): Promise<SignedMessage> {
    const key = await this.serverKey();
    const signature = crypto.sign(this.options.hashAlgorithm, data, this.signOptions(key));

    return { message: data, signature };
  }

  hash(data: BinaryLike): string {
    return crypto.createHash(this.options.hashAlgorithm).update(data).digest("base64");
  }

  getNonce(): Buffer {
    return crypto.randomBytes(this.options.nonceSize);
  }

  private signOptions(key: KeyLike) {
    return {
      key: isKeyObject(key) ? key : crypto.createPrivateKey(key),
      padding: this.options.signaturePadding,
    };
  }

  private verifyOptions(key: KeyLike) {
    return {
      key: isKeyObject(key) ? key : crypto.createPublicKey(key),
      padding: this.options.signaturePadding,
    };
  }

  private encryptOptions(key: KeyLike) {
    return {
      key,
      oaepHash: this.options.hashAlgorithm,
      padding: this.options.messagePadding,
    };
  }

  private async serverKey(): Promise<KeyObject> {
    if (isKeyObject(this.key)) {
      return this.key;
    }
    const keyResult = this.key();
    const keyLike = isPromise(keyResult) ? await keyResult : keyResult;
    return isKeyObject(keyLike) ? keyLike : crypto.createPrivateKey(keyLike);
  }
}
