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
    toast.success(`Welcome to SkillPath AI, ${name}!`);
    router.push("/dashboard");
  }

  async function handleGoogleSignIn() {
    setError(null);
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-zinc-50 px-4 py-16">
      {/* Clean, minimal backdrop — a soft tonal wash, no image. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-50/70 via-transparent to-transparent" />

      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200/70 bg-white/75 p-8 shadow-xl shadow-zinc-900/5 backdrop-blur-xl">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
          </div>

          <div className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            <label htmlFor="signup-image" className="flex items-center gap-2">
              Profile image URL
              <span className="text-xs font-normal text-zinc-400">Optional</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-zinc-100 shadow-sm ring-1 ring-zinc-200">
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
                  <User size={20} className="text-zinc-400" />
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
            <div className="-mt-2 flex flex-col gap-3 rounded-lg bg-zinc-50 p-3.5">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
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
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {PASSWORD_REQUIREMENTS.map((req) => {
                  const met = req.test(password);
                  return (
                    <li
                      key={req.id}
                      className={`flex items-center gap-1.5 text-xs ${met ? "text-indigo-600" : "text-zinc-400"}`}
                    >
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
                          met ? "bg-indigo-600 text-white" : "bg-zinc-200 text-zinc-400"
                        }`}
                      >
                        {met ? <Check size={10} /> : <X size={10} />}
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
