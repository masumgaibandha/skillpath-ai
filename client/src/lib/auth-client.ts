import { createAuthClient } from "better-auth/react";

// No baseURL: Better Auth's client defaults to the relative path
// "/api/auth", which resolves against the current origin. Next's rewrite
// in next.config.ts proxies that to Express, so no client-side origin
// config is needed.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
