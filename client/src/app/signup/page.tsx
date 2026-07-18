"use client";

import { Button, Input, toast } from "@heroui/react";
import { Check, TriangleAlert, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_REQUIREMENTS, isStrongPassword } from "@/lib/password";
import { GoogleIcon } from "@/components/GoogleIcon";
import { PasswordInput } from "@/components/PasswordInput";

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBroken, setImageBroken] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordTouched = password.length > 0;
  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;
  const imageProvided = imageUrl.trim().length > 0;
  const imageUrlValid = !imageProvided || isValidImageUrl(imageUrl.trim());
  const metCount = PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length;

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isStrongPassword(password)) {
      const message = "Password doesn't meet all the requirements below.";
      setError(message);
      toast.danger(message);
      return;
    }
    if (!passwordsMatch) {
      const message = "Passwords do not match.";
      setError(message);
      toast.danger(message);
      return;
    }
    if (!imageUrlValid) {
      const message = "Profile image must be a valid http(s) URL.";
      setError(message);
      toast.danger(message);
      return;
    }

    setIsSubmitting(true);
    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
      image: imageProvided ? imageUrl.trim() : undefined,
    });

    setIsSubmitting(false);
    if (signUpError) {
      const message = signUpError.message ?? "Could not create your account.";
      setError(message);
      toast.danger(message);
      return;
    }

    // autoSignIn is disabled server-side (server/src/lib/auth.ts) — signing
    // up never establishes a session. Send the user to /login to sign in
    // explicitly, carrying their email forward so they don't retype it.
    toast.success("Account created successfully. Please log in.");
    router.push(`/login?registered=true&email=${encodeURIComponent(email)}`);
  }

  async function handleGoogleSignIn() {
    setError(null);
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-[480px] rounded-xl border border-zinc-200/80 bg-white/80 p-8 shadow-md shadow-zinc-900/5 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">Start learning with SkillPath AI, free.</p>

        {error && (
          <p
            role="alert"
            className="mt-5 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            <TriangleAlert size={16} className="shrink-0" />
            {error}
          </p>
        )}

        <form onSubmit={handleSignUp} className="mt-6 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Name
            <Input
              type="text"
              required
              autoComplete="name"
              placeholder="Ada Lovelace"
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
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
          </label>

          <div className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            <label htmlFor="signup-image" className="flex items-center gap-2">
              Profile image URL
              <span className="text-xs font-normal text-zinc-400">Optional</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                {imageProvided && imageUrlValid && !imageBroken ? (
                  // Arbitrary user-supplied URL from any host — next/image
                  // requires a fixed allowlist of remote hostnames, so a
                  // plain <img> with an error fallback is the correct tool
                  // here, not next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl.trim()}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setImageBroken(true)}
                    onLoad={() => setImageBroken(false)}
                  />
                ) : (
                  <User size={18} className="text-zinc-400" />
                )}
              </div>
              <Input
                id="signup-image"
                type="url"
                placeholder="https://example.com/your-photo.jpg"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageBroken(false);
                }}
                fullWidth
              />
            </div>
            {imageProvided && !imageUrlValid && (
              <span className="text-xs text-red-600">Enter a valid http(s) URL.</span>
            )}
            {imageProvided && imageUrlValid && imageBroken && (
              <span className="text-xs text-amber-600">
                Couldn&apos;t load a preview — double-check the link still works.
              </span>
            )}
            <span className="text-xs font-normal text-zinc-400">
              Shown as your avatar across the site. Leave blank to use your initial instead.
            </span>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Password
            <PasswordInput
              required
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
            />
          </label>

          {passwordTouched && (
            <div className="-mt-2.5 flex flex-col gap-2 rounded-lg bg-zinc-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < metCount
                          ? metCount <= 2
                            ? "bg-amber-400"
                            : "bg-indigo-600"
                          : "bg-zinc-200"
                      }`}
                    />
                  ))}
                </div>
                <span
                  className={`text-xs font-medium ${metCount <= 2 ? "text-amber-600" : "text-indigo-600"}`}
                >
                  {STRENGTH_LABELS[metCount]}
                </span>
              </div>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = req.test(password);
                  return (
                    <li
                      key={req.id}
                      className={`flex items-center gap-1.5 text-xs ${met ? "text-indigo-600" : "text-zinc-400"}`}
                    >
                      <span
                        className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full ${
                          met ? "bg-indigo-600 text-white" : "bg-zinc-200 text-zinc-400"
                        }`}
                      >
                        {met ? <Check size={9} /> : <X size={9} />}
                      </span>
                      {req.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Confirm password
            <PasswordInput
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            {confirmTouched && (
              <span
                className={`flex items-center gap-1.5 text-xs ${passwordsMatch ? "text-indigo-600" : "text-red-600"}`}
              >
                {passwordsMatch ? <Check size={14} /> : <X size={14} />}
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </span>
            )}
          </label>

          <Button type="submit" variant="primary" isDisabled={isSubmitting} fullWidth className="mt-1">
            {isSubmitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <div className="mt-5 flex items-center gap-3 text-xs font-medium text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200" />
          OR CONTINUE WITH
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <Button variant="outline" fullWidth className="mt-5" onPress={handleGoogleSignIn}>
          <GoogleIcon size={16} />
          Continue with Google
        </Button>

        <p className="mt-6 text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
