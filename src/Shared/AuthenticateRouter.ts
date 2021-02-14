import { Types } from "@linkedmink/passport-mutual-key-challenge";
import { NextFunction, Router, Request, Response, RequestHandler } from "express";
import { sign } from "jsonwebtoken";
import passport from "passport";
import { JWT_OPTIONS, JWT_PRIVATE_KEY, REALM } from "./PassportJwt";
import { MockUser, PASSPORT_MUTUAL_STRATEGY } from "./PassportMutual";

export const authenticateRouter = Router();

authenticateRouter.post("/", (req: Request, res: Response, next: NextFunction) => {
  const authHandler = passport.authenticate(
    PASSPORT_MUTUAL_STRATEGY,
    { session: false },
    (
      authError: Types.ChallengeError,
      user: MockUser,
      challenge: Types.ServerChallenge,
      status: number
    ) => {
      if (challenge && status) {
        res.setHeader("WWW-Authenticate", `Mutual realm=${REALM}`);
        const jsonBase64Encoded = {
          clientRequested: {
            message: challenge.clientRequested.message.toString("base64"),
            signature: challenge.clientRequested.signature.toString("base64"),
          },
          serverRequested: {
            message: challenge.serverRequested.message.toString("base64"),
            signature: challenge.serverRequested.signature.toString("base64"),
          },
        };
        return res.status(status).send(jsonBase64Encoded);
      }

      if (authError) {
        res.setHeader("WWW-Authenticate", `Mutual realm=${REALM}`);
        return res.status(401).send(authError.message);
      }

      if (!user) {
        return res.status(500).send("Unspecified Error");
      }

      req.login(user, { session: false }, error => {
        if (error) {
          return res.status(400);
        }

        const token = sign(user, JWT_PRIVATE_KEY, {
          ...JWT_OPTIONS,
          subject: user.id,
        });

        res.status(200).send({ token });
      });
    }
  ) as RequestHandler;

  return authHandler(req, res, next);
});
