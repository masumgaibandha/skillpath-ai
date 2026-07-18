"use client";

import { Button, Input } from "@heroui/react";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signUpError } = await authClient.signUp.email({ name, email, password });

    setIsSubmitting(false);
    if (signUpError) {
      setError(signUpError.message ?? "Could not create your account.");
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
        <h1 className="text-2xl font-bold text-zinc-900">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">Start learning with SkillPath AI, free.</p>

        {error && (
          <p
            role="alert"
            className="mt-5 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            <TriangleAlert size={16} />
            {error}
          </p>
        )}

        <form onSubmit={handleSignUp} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Name
            <Input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
          </label>
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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
          </label>
          <Button type="submit" variant="primary" isDisabled={isSubmitting} fullWidth>
            {isSubmitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200" />
          or
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <Button variant="outline" fullWidth className="mt-4" onPress={handleGoogleSignIn}>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
