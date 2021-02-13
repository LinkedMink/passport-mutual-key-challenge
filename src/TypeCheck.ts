import { ChallengeOrResponse, ChallengeResponse } from "./Types";

export function isPromise<T>(toCheck: unknown): toCheck is Promise<T> {
  return (toCheck as Promise<T>).then !== undefined;
}

export function isString(toCheck: unknown): toCheck is string {
  return typeof toCheck === "string" || toCheck instanceof String;
}

export function isBuffer(toCheck: unknown): toCheck is Buffer {
  return (toCheck as Buffer).swap64 !== undefined;
}

export function isChallengeResponse(value: ChallengeOrResponse): value is ChallengeResponse {
  return (value as ChallengeResponse).clientResponsed !== undefined;
}
