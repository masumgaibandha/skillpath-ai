"use client";

import { Button, Input, TextArea } from "@heroui/react";
import { CheckCircle2, Mail, TriangleAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import { fetchClientApi } from "@/lib/api";

const SUPPORT_EMAIL = "masumgaibandha@gmail.com";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      await fetchClientApi("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setError("Something went wrong sending your message. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">Contact us</h1>
      <p className="mt-4 text-lg text-zinc-600">
        Questions about a course, your account, or the platform in general — send a message and
        we'll get back to you.
      </p>

      <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
        <Mail size={16} />
        <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-indigo-600">
          {SUPPORT_EMAIL}
        </a>
      </div>

      {status === "success" ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-10 text-center">
          <CheckCircle2 className="text-indigo-600" size={40} />
          <p className="mt-4 text-lg font-semibold text-zinc-900">Message sent</p>
          <p className="mt-1 text-zinc-500">
            Thanks for reaching out — we've received your message and will respond by email.
          </p>
          <Button variant="outline" size="sm" className="mt-6" onPress={() => setStatus("idle")}>
            Send another message
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
          {status === "error" && (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700"
            >
              <TriangleAlert size={16} />
              {error}
            </p>
          )}

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
            Message
            <TextArea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
            />
          </label>

          <Button type="submit" variant="primary" isDisabled={status === "submitting"}>
            {status === "submitting" ? "Sending…" : "Send message"}
          </Button>
        </form>
      )}
    </div>
  );
}
