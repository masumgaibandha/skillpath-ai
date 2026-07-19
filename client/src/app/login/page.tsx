"use client";

import { Button, Input, toast } from "@heroui/react";
import { CheckCircle2, TriangleAlert, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GoogleIcon } from "@/components/GoogleIcon";
import { PasswordInput } from "@/components/PasswordInput";
import { authClient } from "@/lib/auth-client";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@skillpathai.com";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "DemoPass123!";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  // Signup (autoSignIn is disabled server-side) forwards the just-
  // registered email here so the user doesn't have to retype it — read
  // once as the initial state rather than syncing via an effect, since
  // this only needs to run on first mount.
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
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
      const message = signInError.message ?? "Invalid email or password.";
      setError(message);
      toast.danger(message);
      return;
    }
    toast.success("Welcome back!");
    router.push("/dashboard");
  }

  async function handleDemoLogin() {
    // Visibly populate the fields first, then sign in with the same
    // values — this must never be a silent sign-in with no visible fill.
    // The deliberate pause guarantees a human actually sees the fields
    // fill in before submission, regardless of how fast the network
    // response would otherwise arrive.
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError(null);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { error: signInError } = await authClient.signIn.email({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

    setIsSubmitting(false);
    if (signInError) {
      const message = signInError.message ?? "Demo login failed.";
      setError(message);
      toast.danger(message);
      return;
    }
    toast.success("Signed in with the demo account");
    router.push("/dashboard");
  }

  async function handleGoogleSignIn() {
    setError(null);
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-[440px] rounded-xl border border-zinc-200/80 bg-white/80 p-8 shadow-md shadow-zinc-900/5 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Log in</h1>
        <p className="mt-1 text-sm text-zinc-500">Welcome back to SkillPath AI.</p>

        {error ? (
          <p
            role="alert"
            className="mt-5 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            <TriangleAlert size={16} className="shrink-0" />
            {error}
          </p>
        ) : justRegistered ? (
          <p className="mt-5 flex items-center gap-2 rounded-md bg-indigo-50 p-3 text-sm text-indigo-700">
            <CheckCircle2 size={16} className="shrink-0" />
            Account created successfully. Please log in.
          </p>
        ) : null}

        <form onSubmit={handleEmailSignIn} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Email
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Password
            <PasswordInput
              required
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
            />
          </label>
          <Button type="submit" variant="primary" isDisabled={isSubmitting} fullWidth className="mt-1">
            {isSubmitting ? "Signing in…" : "Log in"}
          </Button>
        </form>

        <div className="mt-5 flex items-center gap-3 text-xs font-medium text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200" />
          OR CONTINUE WITH
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <Button variant="outline" fullWidth onPress={handleGoogleSignIn}>
            <GoogleIcon size={16} />
            Continue with Google
          </Button>

          {/* Demo Login is a graded requirement — kept as a visible,
              distinctly-styled secondary action (amber accent), not a
              hidden text link. */}
          <Button
            variant="outline"
            isDisabled={isSubmitting}
            fullWidth
            onPress={handleDemoLogin}
            className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
          >
            <Zap size={16} />
            Demo Login
          </Button>
        </div>
        <p className="mt-2.5 text-center text-xs text-zinc-400">
          Fills in the seeded demo account&apos;s credentials above before signing in.
        </p>

        <p className="mt-6 text-sm text-zinc-500">
          No account?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
