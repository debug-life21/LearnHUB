import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import type { NextFunction, Request, Response } from "express";
import { env, isProduction } from "./config.js";
import { ApiError } from "./lib/http.js";
import { UserModel, type UserRole, roles } from "./models/User.js";

const cookieName = "learnhub_token";

type TokenPayload = {
  sub: string;
  role: UserRole;
};

export type AuthedRequest = Request & {
  user?: {
    id: string;
    role: UserRole;
  };
};

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as StringValue,
  });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(cookieName);
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies[cookieName];

  if (!token) {
    return next(new ApiError(401, "Authentication required."));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired session."));
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(401, "Authentication required."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission for this action."));
    }

    const user = await UserModel.findById(req.user.id).lean();

    if (!user || user.accountStatus !== "active") {
      return next(new ApiError(403, "Your account is not active."));
    }

    return next();
  };
}
