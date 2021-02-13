import { NextFunction, Request, RequestHandler, Response } from "express";
import passport from "passport";
import { IJwtPayload, PASSPORT_JWT_STRATEGY } from "./PassportJwt";

function isError(error: unknown): error is Error {
  return (error as Error).message !== undefined;
}

function isString(toCheck: unknown): toCheck is string {
  return typeof toCheck === "string" || toCheck instanceof String;
}

export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
  const authenticateHandler = passport.authenticate(
    PASSPORT_JWT_STRATEGY,
    { session: false },
    (error: unknown, payload: IJwtPayload, info: unknown) => {
      let errorMessage;
      if (isString(error)) {
        errorMessage = error;
      } else if (isError(info)) {
        errorMessage = info.message;
      } else if (!payload) {
        errorMessage = "Not Authorized";
      }

      if (errorMessage) {
        res.status(401);
        res.send(errorMessage);
        return;
      }

      return next();
    }
  ) as RequestHandler;

  authenticateHandler(req, res, next);
};
