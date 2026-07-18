import { Bot, Compass, GraduationCap, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { fetchServerApi } from "@/lib/api";
import { COURSE_CATEGORIES } from "@/lib/constants";
import type { CourseListResponse } from "@/lib/types";

export const metadata: Metadata = {
  title: "About — SkillPath AI",
  description: "What SkillPath AI is, why it exists, and how the AI features work.",
};

export default async function AboutPage() {
  const { total } = await fetchServerApi<CourseListResponse>("/api/courses?limit=1");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">About SkillPath AI</h1>
      <p className="mt-4 text-lg text-zinc-600">
        Most course catalogs are just a list — you're expected to already know what to search
        for and in what order to take things. SkillPath AI exists to close that gap: a real
        course catalog paired with AI that turns a goal into an actual plan.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 p-5 text-center">
          <p className="text-3xl font-bold text-indigo-600">{total}</p>
          <p className="mt-1 text-sm text-zinc-500">published courses</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 text-center">
          <p className="text-3xl font-bold text-indigo-600">{COURSE_CATEGORIES.length}</p>
          <p className="mt-1 text-sm text-zinc-500">categories covered</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-5 text-center">
          <p className="text-3xl font-bold text-indigo-600">2</p>
          <p className="mt-1 text-sm text-zinc-500">built-in AI features</p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-zinc-900">What you can do here</h2>
        <div className="mt-6 flex flex-col gap-5">
          <div className="flex gap-4">
            <Compass className="mt-1 shrink-0 text-indigo-600" size={22} />
            <div>
              <p className="font-medium text-zinc-900">Search and filter real courses</p>
              <p className="mt-1 text-sm text-zinc-600">
                Every course has a genuine description, a realistic duration and price, and an
                instructor — filterable by category, level, and price so you can actually narrow
                down what fits.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <GraduationCap className="mt-1 shrink-0 text-indigo-600" size={22} />
            <div>
              <p className="font-medium text-zinc-900">Enroll free or buy once</p>
              <p className="mt-1 text-sm text-zinc-600">
                Free courses enroll instantly. Paid courses use a one-time secure checkout — no
                recurring subscriptions to track or cancel.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Sparkles className="mt-1 shrink-0 text-indigo-600" size={22} />
            <div>
              <p className="font-medium text-zinc-900">AI Study Planner</p>
              <p className="mt-1 text-sm text-zinc-600">
                Give it your goal, current skill level, weekly time budget, and timeframe. It
                returns a milestone roadmap built from courses actually in the catalog, and you
                can send feedback to have it regenerate the plan.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Bot className="mt-1 shrink-0 text-indigo-600" size={22} />
            <div>
              <p className="font-medium text-zinc-900">Chat Assistant</p>
              <p className="mt-1 text-sm text-zinc-600">
                A conversational assistant that can search the course catalog on your behalf and
                answer questions about what to learn next.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-zinc-900">Who owns what</h2>
        <p className="mt-3 text-sm text-zinc-600">
          Course management here is owner-based, not admin-gated: any signed-up user can add and
          manage their own courses from their dashboard. There's no approval queue — it's built
          this way so the catalog reflects real contributions rather than a single gatekeeper.
        </p>
      </section>

      <div className="mt-12 rounded-xl border border-indigo-100 bg-indigo-50 p-6 text-center">
        <p className="font-medium text-zinc-900">Have a question we didn&apos;t answer here?</p>
        <Link
          href="/contact"
          className="mt-3 inline-block rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
