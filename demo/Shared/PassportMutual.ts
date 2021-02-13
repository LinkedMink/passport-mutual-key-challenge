import {
  MutualKeyChallengeOptions,
  MutualKeyChallengeStrategy,
  OptionFuncs,
} from "@linkedmink/passport-mutual-key-challenge";
import fs from "fs";
import { IncomingMessage } from "http";
import { PassportStatic } from "passport";
import { v4 as uuidV4 } from "uuid";
import { JWT_PRIVATE_KEY } from "./PassportJwt";

export const PASSPORT_MUTUAL_STRATEGY = "mutual";

export interface MockUser {
  userId: string;
  key: Buffer;
}

const getUser = (req: IncomingMessage, key: Buffer): MockUser | null => {
  return {
    userId: uuidV4(),
    key: fs.readFileSync("client.key.pub"),
  };
};

export const addMutualStrategy = (passport: PassportStatic): void => {
  const options: MutualKeyChallengeOptions = {
    ...OptionFuncs.getDefaultOptions(),
    serverKey: JWT_PRIVATE_KEY,
    userFunc: getUser,
    challengeOrResponseFunc: OptionFuncs.challengeByBase64Body("key", "challenge", "response"),
  };

  passport.use(PASSPORT_MUTUAL_STRATEGY, new MutualKeyChallengeStrategy(options));
};
