import { getSession } from "@auth/express";
import { authConfig } from "../config/auth.js";
import { HttpError } from "../utils/HttpError.js";

/** Reads the Auth.js session cookie and attaches req.user = { id, role, name, email }. */
export async function requireAuth(req, _res, next) {
  try {
    const session = await getSession(req, authConfig);
    if (!session?.user?.id) throw new HttpError(401, "Please log in to continue.");
    const { id, role, name, email } = session.user;
    req.user = { id, role, name, email };
    next();
  } catch (err) {
    next(err);
  }
}

export const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role) ? next() : next(new HttpError(403, "You do not have access to this resource."));
