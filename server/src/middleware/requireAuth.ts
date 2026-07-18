import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

// Augment Express's Request with the fields this middleware attaches.
declare module "express-serve-static-core" {
  interface Request {
    session?: Awaited<ReturnType<typeof auth.api.getSession>>;
  }
}

/**
 * Authoritative session check for protected Express routes. Next's
 * middleware.ts does a fast cookie-presence check for UX, but every
 * protected API route must re-verify here — the client-side check can be
 * bypassed by calling the API directly.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  req.session = session;
  next();
}
