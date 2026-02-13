import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import { IUser } from "../models/user.model";
// global augmentation for Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: Record<string, any> | IUser;
    }
  }
}

let userRepository = new UserRepository();

const getTokenFromRequest = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : undefined;
  const tokenFromCookie = (req as any).cookies?.token || (req as any).cookies?.accessToken;
  const tokenFromBody = (req.body as any)?.token;

  const token = tokenFromHeader || tokenFromCookie || tokenFromBody;
  if (typeof token !== "string") return undefined;

  // Strip accidental wrapping quotes
  return token.replace(/^"(.+)"$/, "$1");
};

export const authorizedMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new HttpError(401, "Unauthorized, Token missing");
    }

    const decodedToken = jwt.verify(token, JWT_SECRET) as Record<string, any>; // verify with Secret

    if (!decodedToken || !decodedToken.id) {
      throw new HttpError(401, "Unauthorized, Token invalid");
    }

    const user = await userRepository.getUserById(decodedToken.id);

    if (!user) {
      throw new HttpError(401, "Unauthorized, User not found");
    }

    // attach user to request object
    req.user = user;

    next();
  } catch (error: any) {
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || "Unauthorized",
    });
  }
};

// any function after authorizedMiddleware can acces req.user
export const adminOnlyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user && (req.user as any).role === "admin") {
      next();
    } else {
      throw new HttpError(403, "Forbidden, admins only");
    }
  } catch (error: any) {
    return res.status(error.statusCode || 403).json({
      success: false,
      message: error.message || "Forbidden",
    });
  }
};