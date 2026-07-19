import { Bot, Compass, GraduationCap, MessagesSquare, Search, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import aiFeaturesImage from "@/assets/ai-features-planner-chat.webp";
import heroCourseDiscovery from "@/assets/hero-course-discovery.webp";
import heroLearnGrow from "@/assets/hero-learn-grow.webp";
import heroLearningPath from "@/assets/hero-learning-path.webp";
import { CourseCard } from "@/components/CourseCard";
import { HeroCarousel, type HeroSlide } from "@/components/HeroCarousel";
import { fetchServerApi } from "@/lib/api";
import { COURSE_CATEGORIES } from "@/lib/constants";
import type { CourseListResponse } from "@/lib/types";

export const metadata: Metadata = {
  title: "SkillPath AI — Learn With an AI-Guided Roadmap",
  description:
    "Browse real courses, enroll free or paid, and get an AI-generated study roadmap tailored to your goals.",
};

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: "Search and filter",
    description:
      "Browse 24 courses across 12 categories — filter by level, price, and category, or search by keyword.",
  },
  {
    icon: GraduationCap,
    title: "Enroll free or paid",
    description:
      "Start a free course instantly, or purchase a paid one securely — no subscriptions, one-time access.",
  },
  {
    icon: Sparkles,
    title: "Get an AI study plan",
    description:
      "Tell the AI Study Planner your goal, skill level, and weekly hours — it builds a milestone roadmap from real courses.",
  },
  {
    icon: MessagesSquare,
    title: "Ask the chat assistant",
    description:
      "Get course recommendations and answers from a chat assistant that can search the catalog for you.",
  },
];

const HERO_SLIDES: HeroSlide[] = [
  {
    image: heroLearningPath,
    imageAlt: "Learner following a personalized study roadmap on a laptop",
    headline: "Learn with a roadmap built specifically for you",
    description:
      "SkillPath AI turns your goals into an AI-generated study plan — a clear, milestone-by-milestone path instead of guesswork about what to learn next.",
    primaryCta: { label: "Explore courses", href: "/explore" },
    secondaryCta: { label: "Create free account", href: "/signup" },
  },
  {
    image: heroCourseDiscovery,
    imageAlt: "Learner searching and filtering through a course catalog",
    headline: "Find the right course, fast",
    description:
      "Search and filter 24 real courses across 12 categories — by level, price, and topic — until you find exactly what fits.",
    primaryCta: { label: "Browse all courses", href: "/explore" },
    secondaryCta: { label: "How it works", href: "/about" },
  },
  {
    image: heroLearnGrow,
    imageAlt: "Learner building new skills and making visible progress",
    headline: "Build skills that actually move you forward",
    description:
      "Enroll free or purchase once — no subscriptions — and work toward a goal an AI helped you define.",
    primaryCta: { label: "Get started for free", href: "/signup" },
    secondaryCta: { label: "Explore courses", href: "/explore" },
  },
];

const WHY_SKILLPATH = [
  "24 expertly structured courses across 12 in-demand fields, from web development to AI/ML",
  "Real filtering and search — by category, level, price, and free-vs-paid — not just a static list",
  "An AI study planner that turns your goal and schedule into a milestone roadmap you can refine with feedback",
  "Own your courses — sign in with email/password or Google, manage what you've added, no admin gatekeeping",
];

export default async function Home() {
  const featured = await fetchServerApi<CourseListResponse>("/api/courses?sort=rating&limit=4");

  return (
    <div className="flex flex-1 flex-col">
      {/* 1. Hero */}
      <HeroCarousel slides={HERO_SLIDES} />

      {/* 2. How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-zinc-900">How it works</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.title} className="rounded-xl border border-zinc-200 p-5">
              <step.icon className="text-indigo-600" size={24} />
              <p className="mt-3 font-semibold text-zinc-900">{step.title}</p>
              <p className="mt-1 text-sm text-zinc-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured courses */}
      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-zinc-900">Featured courses</h2>
            <Link href="/explore" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Browse by category */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-zinc-900">Browse by category</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COURSE_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/explore?category=${encodeURIComponent(category)}`}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <Compass size={16} className="shrink-0 text-zinc-400" />
              {category}
            </Link>
          ))}
        </div>
      </section>

      {/* 5. AI features highlight */}
      <section className="border-t border-zinc-200 bg-zinc-900">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
            <Image
              src={aiFeaturesImage}
              alt="AI Study Planner and Chat Assistant guiding a learner's next step"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Two AI features built into your account</h2>
            <div className="mt-6 flex flex-col gap-5">
              <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-6">
                <Sparkles className="text-amber-400" size={24} />
                <p className="mt-3 font-semibold text-white">AI Study Planner</p>
                <p className="mt-2 text-sm text-zinc-300">
                  Share your goal, current skill level, weekly hours, and budget. The planner
                  generates a milestone-by-milestone roadmap built from real courses in the
                  catalog — and you can submit feedback to regenerate it as your plan evolves.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-6">
                <Bot className="text-amber-400" size={24} />
                <p className="mt-3 font-semibold text-white">Chat Assistant</p>
                <p className="mt-2 text-sm text-zinc-300">
                  Ask questions in plain language — the assistant can search the course catalog
                  directly and recommend courses that match what you&apos;re asking for.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Why learners choose SkillPath AI */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-zinc-900">Why learners choose SkillPath AI</h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {WHY_SKILLPATH.map((reason) => (
            <li key={reason} className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4">
              <Sparkles size={18} className="mt-0.5 shrink-0 text-indigo-600" />
              <span className="text-sm text-zinc-600">{reason}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 7. Final CTA */}
      <section className="border-t border-zinc-200 bg-indigo-600">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to start learning?</h2>
          <p className="mt-3 max-w-xl text-indigo-100">
            Create a free account and get your first AI-generated study roadmap in minutes.
          </p>
          <Link
            href="/signup"
            className="mt-6 rounded-md bg-white px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Get started for free
          </Link>
        </div>
      </section>
    </div>
  );
}
