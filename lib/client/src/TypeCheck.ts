import { KeyObject } from "crypto";

export function isBuffer(toCheck: unknown): toCheck is Buffer {
  return !!toCheck && (toCheck as Buffer).swap64 !== undefined;
}

export function isKeyObject(value: unknown): value is KeyObject {
  return !!value && (value as KeyObject).type !== undefined;
}
