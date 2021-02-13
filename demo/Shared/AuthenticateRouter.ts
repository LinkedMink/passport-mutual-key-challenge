import { Types } from "@linkedmink/passport-mutual-key-challenge";
import { NextFunction, Router, Request, Response, RequestHandler } from "express";
import { sign } from "jsonwebtoken";
import passport from "passport";
import { JWT_OPTIONS, JWT_PRIVATE_KEY } from "./PassportJwt";
import { MockUser, PASSPORT_MUTUAL_STRATEGY } from "./PassportMutual";

export const authenticateRouter = Router();

authenticateRouter.post("/", (req: Request, res: Response, next: NextFunction) => {
  const authHandler = passport.authenticate(
    PASSPORT_MUTUAL_STRATEGY,
    { session: false },
    (authError: Types.ChallengeError, user: MockUser) => {
      if (authError || !user) {
        return res.status(401).send(authError);
      }

      req.login(user, { session: false }, error => {
        if (error) {
          return res.status(400);
        }

        const token = sign(user, JWT_PRIVATE_KEY, {
          ...JWT_OPTIONS,
          subject: user.userId,
        });

        res.status(200).send({ token });
      });
    }
  ) as RequestHandler;

  authHandler(req, res, next);
});
