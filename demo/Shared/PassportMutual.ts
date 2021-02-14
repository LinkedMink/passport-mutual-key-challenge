import {
  challengeByBase64Body,
  MutualKeyChallengeOptions,
  MutualKeyChallengeStrategy,
  Types,
} from "@linkedmink/passport-mutual-key-challenge";
import fs from "fs";
import { IncomingMessage } from "http";
import { PassportStatic } from "passport";
import { JWT_PRIVATE_KEY } from "./PassportJwt";

export const PASSPORT_MUTUAL_STRATEGY = "mutual";

export interface MockUser {
  id: string;
}

const getUser = (req: IncomingMessage, userId: string): Types.UserKeyRecord<MockUser> | null => {
  return {
    user: {
      id: userId,
    },
    publicKey: fs.readFileSync("client.key.pub"),
  };
};

export const addMutualStrategy = (passport: PassportStatic): void => {
  const options: MutualKeyChallengeOptions = {
    serverKey: JWT_PRIVATE_KEY,
    userFunc: getUser,
    challengeOrResponseFunc: challengeByBase64Body("userId", "challenge", "response"),
  };

  passport.use(PASSPORT_MUTUAL_STRATEGY, new MutualKeyChallengeStrategy(options));
};
