"use client";

import { Button, Input } from "@heroui/react";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@skillpathai.com";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "DemoPass123!";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await authClient.signIn.email({ email, password });

    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message ?? "Invalid email or password.");
      return;
    }
    router.push("/dashboard");
  }

  async function handleDemoLogin() {
    // Visibly populate the fields first, then sign in with the same
    // values — this must never be a silent sign-in with no visible fill.
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await authClient.signIn.email({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message ?? "Demo login failed.");
      return;
    }
    router.push("/dashboard");
  }

  async function handleGoogleSignIn() {
    setError(null);
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Log in</h1>
        <p className="mt-1 text-sm text-zinc-500">Welcome back to SkillPath AI.</p>

        {error && (
          <p
            role="alert"
            className="mt-5 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            <TriangleAlert size={16} />
            {error}
          </p>
        )}

        <form onSubmit={handleEmailSignIn} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Email
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Password
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
          </label>
          <Button type="submit" variant="primary" isDisabled={isSubmitting} fullWidth>
            {isSubmitting ? "Signing in…" : "Log in"}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200" />
          or
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button variant="outline" isDisabled={isSubmitting} fullWidth onPress={handleDemoLogin}>
            Demo Login
          </Button>
          <Button variant="outline" fullWidth onPress={handleGoogleSignIn}>
            Continue with Google
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
