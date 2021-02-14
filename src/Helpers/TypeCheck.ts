import { KeyObject } from "crypto";
import { ClientChallenge, ClientResponse } from "../Types/Messages";

export function isPromise<T>(toCheck: unknown): toCheck is Promise<T> {
  return (toCheck as Promise<T>).then !== undefined;
}

export function isString(toCheck: unknown): toCheck is string {
  return typeof toCheck === "string" || toCheck instanceof String;
}

export function isBuffer(toCheck: unknown): toCheck is Buffer {
  return (toCheck as Buffer).swap64 !== undefined;
}

export function isClientResponse(value: ClientChallenge | ClientResponse): value is ClientResponse {
  return (value as ClientResponse).clientResponsed !== undefined;
}

export function isKeyObject(value: unknown): value is KeyObject {
  return (value as KeyObject).type !== undefined;
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return (value as (...args: unknown[]) => unknown).call !== undefined;
}
