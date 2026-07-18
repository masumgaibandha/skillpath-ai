// Mirrors client/src/lib/password.ts — duplicated per CLAUDE.md's
// "duplicate small shared types" rule rather than a shared package. This
// copy is the authoritative one: enforced in the Better Auth sign-up hook
// (see src/lib/auth.ts) regardless of what the client already validated.
export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}
