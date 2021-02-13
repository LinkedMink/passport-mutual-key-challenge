import crypto, { RsaPrivateKey } from "crypto";
import { isBuffer, isString } from "./TypeCheck";
import { EncryptOptions, GetServerKeyFunc, InMemoryKey, SignedMessage } from "./Types";

const NONCE_SIZE = 128;

export class MessageVerifier {
  private readonly hashFunc = crypto.createHash(this.options.hashAlgorithm);

  constructor(
    private readonly key: GetServerKeyFunc | InMemoryKey,
    private readonly options: EncryptOptions
  ) {}

  async decryptAndVerify(pubKey: Buffer, data: SignedMessage): Promise<Buffer | null> {
    const server = await this.serverKey();
    const decrypted = crypto.privateDecrypt(server, data.message);
    const isVerified = crypto.verify(this.options.hashAlgorithm, decrypted, pubKey, data.signature);
    return isVerified ? decrypted : null;
  }

  async encryptAndSign(pubKey: Buffer, data: Buffer): Promise<SignedMessage> {
    const server = await this.serverKey();
    const message = crypto.publicEncrypt(
      {
        key: pubKey,
        padding: this.options.padding,
      },
      data
    );
    const signature = crypto.sign(this.options.hashAlgorithm, data, {
      key: server.key as Buffer,
      padding: server.padding,
    });

    return { message, signature };
  }

  async sign(data: Buffer): Promise<SignedMessage> {
    const server = await this.serverKey();
    const signature = crypto.sign(this.options.hashAlgorithm, data, {
      key: server.key as Buffer,
      padding: server.padding,
    });

    return { message: data, signature };
  }

  hash(data: Buffer): string {
    return this.hashFunc.update(data).digest("base64");
  }

  getNonce(): Buffer {
    return crypto.randomBytes(NONCE_SIZE);
  }

  private async serverKey(): Promise<RsaPrivateKey> {
    const key = !isString(this.key) && !isBuffer(this.key) ? await this.key() : this.key;

    return {
      key: isString(key) ? Buffer.from(key) : key,
      oaepHash: this.options.hashAlgorithm,
      padding: this.options.padding,
    };
  }
}
