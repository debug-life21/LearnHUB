import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env, isProduction } from "./config.js";
import { ApiError } from "./lib/http.js";
import { UserModel, roles } from "./models/User.js";
const cookieName = "learnhub_token";
export async function hashPassword(password) {
    return argon2.hash(password);
}
export async function verifyPassword(hash, password) {
    return argon2.verify(hash, password);
}
export function signToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
    });
}
export function setAuthCookie(res, token) {
    res.cookie(cookieName, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}
export function clearAuthCookie(res) {
    res.clearCookie(cookieName);
}
export function requireAuth(req, _res, next) {
    const token = req.cookies[cookieName];
    if (!token) {
        return next(new ApiError(401, "Authentication required."));
    }
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        req.user = { id: payload.sub, role: payload.role };
        return next();
    }
    catch {
        return next(new ApiError(401, "Invalid or expired session."));
    }
}
export function requireRole(...allowedRoles) {
    return async (req, _res, next) => {
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
