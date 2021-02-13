import crypto from "crypto";
import { isBuffer, isString } from "./TypeCheck";
import { EncryptOptions, GetServerKeyFunc, InMemoryKey, SignedMessage } from "./Types";

const NONCE_SIZE = 128;

export class MessageVerifier {
  constructor(
    private readonly key: GetServerKeyFunc | InMemoryKey,
    private readonly options: EncryptOptions
  ) {}

  async decryptAndVerify(pubKey: Buffer, data: SignedMessage): Promise<Buffer | null> {
    const key = await this.serverKey();
    const decrypted = crypto.privateDecrypt(this.encryptOptions(key), data.message);
    const isVerified = crypto.verify(
      this.options.hashAlgorithm,
      decrypted,
      this.signOptions(pubKey),
      data.signature
    );

    return isVerified ? decrypted : null;
  }

  async encryptAndSign(pubKey: Buffer, data: Buffer): Promise<SignedMessage> {
    const key = await this.serverKey();
    const message = crypto.publicEncrypt(this.encryptOptions(pubKey), data);
    const signature = crypto.sign(this.options.hashAlgorithm, data, this.signOptions(key));

    return { message, signature };
  }

  async verify(pubKey: Buffer, data: SignedMessage): Promise<boolean> {
    const key = await this.serverKey();
    return crypto.verify(
      this.options.hashAlgorithm,
      data.message,
      this.signOptions(pubKey),
      data.signature
    );
  }

  async sign(data: Buffer): Promise<SignedMessage> {
    const key = await this.serverKey();
    const signature = crypto.sign(this.options.hashAlgorithm, data, this.signOptions(key));

    return { message: data, signature };
  }

  hash(data: Buffer): string {
    return crypto.createHash(this.options.hashAlgorithm).update(data).digest("base64");
  }

  getNonce(): Buffer {
    return crypto.randomBytes(NONCE_SIZE);
  }

  private signOptions(key: Buffer) {
    return {
      key,
      padding: this.options.signaturePadding,
    };
  }

  private encryptOptions(key: Buffer) {
    return {
      key,
      oaepHash: this.options.hashAlgorithm,
      padding: this.options.messagePadding,
    };
  }

  private async serverKey(): Promise<Buffer> {
    const key = !isString(this.key) && !isBuffer(this.key) ? await this.key() : this.key;
    return isString(key) ? Buffer.from(key) : key;
  }
}
