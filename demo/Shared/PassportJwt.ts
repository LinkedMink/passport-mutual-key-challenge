import { Request } from "express";
import fs from "fs";
import { SignOptions } from "jsonwebtoken";
import { PassportStatic } from "passport";
import {
  ExtractJwt,
  Strategy as JwtStrategy,
  StrategyOptions as JwtStrategyOptions,
  VerifiedCallback,
} from "passport-jwt";

export const JWT_PRIVATE_KEY = fs.readFileSync("server.key");

export const JWT_OPTIONS = {
  expiresIn: "2 days",
  audience: "api.local",
  issuer: "auth.local",
  algorithm: "RS256",
} as SignOptions;

export const PASSPORT_JWT_STRATEGY = "jwt";

export interface IJwtPayload {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  sub: string;
}

export const addJwtStrategy = (passport: PassportStatic): void => {
  const options: JwtStrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_PRIVATE_KEY,
    issuer: JWT_OPTIONS.issuer,
    audience: JWT_OPTIONS.audience as string,
    algorithms: [JWT_OPTIONS.algorithm as string],
    passReqToCallback: true,
  };

  passport.use(
    PASSPORT_JWT_STRATEGY,
    new JwtStrategy(options, (req: Request, jwtPayload: IJwtPayload, done: VerifiedCallback) => {
      if (jwtPayload.exp && Date.now() / 1000 > jwtPayload.exp) {
        return done("JWT Expired");
      }

      req.user = jwtPayload;
      return done(null, jwtPayload);
    })
  );
};
