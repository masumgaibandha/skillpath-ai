"use client";

import { Button, Input, toast } from "@heroui/react";
import { Check, TriangleAlert, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getErrorMessage } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_REQUIREMENTS, isStrongPassword } from "@/lib/password";

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
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
            <Input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
          </label>

          {passwordTouched && (
            <ul className="-mt-3 grid grid-cols-1 gap-1 rounded-md bg-zinc-50 p-3 sm:grid-cols-2">
              {PASSWORD_REQUIREMENTS.map((req) => {
                const met = req.test(password);
                return (
                  <li
                    key={req.id}
                    className={`flex items-center gap-1.5 text-xs ${met ? "text-indigo-600" : "text-zinc-400"}`}
                  >
                    {met ? <Check size={14} /> : <X size={14} />}
                    {req.label}
                  </li>
                );
              })}
            </ul>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Confirm password
            <Input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
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
