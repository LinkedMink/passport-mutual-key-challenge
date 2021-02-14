#!/usr/bin/env node

import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import passport from "passport";

import { authenticateJwt } from "./Shared/AuthenticateMiddleware";
import { authenticateRouter } from "./Shared/AuthenticateRouter";
import { addJwtStrategy, IJwtPayload } from "./Shared/PassportJwt";
import { addMutualStrategy } from "./Shared/PassportMutual";

const app = express();

app.use(bodyParser.json());

addJwtStrategy(passport);
addMutualStrategy(passport);
app.use(passport.initialize());

app.use("/authenticate", authenticateRouter);
app.get("/protected", [
  authenticateJwt,
  (req: Request, res: Response) => {
    const user = req.user as IJwtPayload;

    res.send({
      mark: Date.now(),
      user,
    });
  },
]);

export const server = app.listen(8080);
