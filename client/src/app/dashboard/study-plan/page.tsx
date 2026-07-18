"use client";

import { Button, Chip, EmptyState, Input, TextArea } from "@heroui/react";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  FlaskConical,
  History,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CourseImage } from "@/components/CourseImage";
import { TagInput } from "@/components/TagInput";
import { useCreateStudyPlan } from "@/hooks/useCreateStudyPlan";
import { useMyStudyPlans } from "@/hooks/useMyStudyPlans";
import { useRefineStudyPlan } from "@/hooks/useRefineStudyPlan";
import { useStudyPlan } from "@/hooks/useStudyPlan";
import { useStudyPlanConfig } from "@/hooks/useStudyPlanConfig";
import { ApiError, getErrorMessage } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { COURSE_LEVELS } from "@/lib/types";
import type { CourseLevel, StudyPlan, StudyPlanRecommendedCourse } from "@/lib/types";

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const GENERATION_STEPS = [
  "Reviewing your goals and constraints…",
  "Matching real courses from the catalog…",
  "Building your weekly roadmap…",
  "Finalizing milestones and next actions…",
];

const fieldLabel = "flex flex-col gap-1.5 text-base font-medium text-zinc-700";
const selectClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
const helperText = "text-xs font-normal text-zinc-400";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** True while the mutation failed specifically because the AI Study
 * Planner has no OPENAI_API_KEY configured server-side — worth a distinct,
 * calmer message than a generic error banner. */
function isUnconfiguredError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503;
}

function GenerationProgress() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, GENERATION_STEPS.length - 1));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-30" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
          <Sparkles size={20} />
        </span>
      </div>
      <p className="mt-5 font-semibold text-zinc-900">Generating your study plan</p>
      <p className="mt-1 text-sm text-zinc-500">{GENERATION_STEPS[stepIndex]}</p>
      <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-700 ease-out"
          style={{ width: `${((stepIndex + 1) / GENERATION_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

function RecommendedCourseCard({ course }: { course: StudyPlanRecommendedCourse }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-indigo-300 hover:shadow-sm sm:flex-row"
    >
      <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:h-16 sm:w-24">
        <CourseImage src={course.images[0] ?? ""} alt={course.title} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold text-zinc-900 group-hover:text-indigo-600">
            {course.title}
          </p>
          <Chip size="sm" variant="soft" color="accent" className="shrink-0">
            {course.matchScore}% match
          </Chip>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <Chip size="sm" variant="soft" color="default">
            {LEVEL_LABEL[course.level]}
          </Chip>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {course.durationHours}h
          </span>
          <span className="font-medium text-zinc-700">
            {course.isFree ? "Free" : `$${course.price.toFixed(2)}`}
          </span>
        </div>
        <p className="line-clamp-2 text-xs text-zinc-500">{course.reason}</p>
        <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
          View course
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function PlanDetail({ plan }: { plan: StudyPlan }) {
  const refinePlan = useRefineStudyPlan(plan._id);
  const [feedback, setFeedback] = useState("");
  const isSubmittingRef = useRef(false);

  function handleRefine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmittingRef.current || refinePlan.isPending) return;
    const trimmed = feedback.trim();
    if (!trimmed) return;
    isSubmittingRef.current = true;
    refinePlan.mutate(
      { feedback: trimmed },
      {
        onSuccess: () => setFeedback(""),
        onSettled: () => {
          isSubmittingRef.current = false;
        },
      }
    );
  }

  const sortedMilestones = [...plan.milestones].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900">{plan.title}</h2>
              <Chip size="sm" variant="soft" color="accent">
                v{plan.version}
              </Chip>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <CalendarClock size={13} />
              Generated {formatDate(plan.generatedAt)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-base leading-relaxed text-zinc-600">{plan.summary}</p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-500">
          <Chip size="sm" variant="soft" color="default">
            {LEVEL_LABEL[plan.inputs.skillLevel]}
          </Chip>
          <Chip size="sm" variant="soft" color="default">
            {plan.inputs.weeklyHours} hrs/week
          </Chip>
          <Chip size="sm" variant="soft" color="default">
            {plan.inputs.timeframeWeeks} weeks
          </Chip>
          <Chip size="sm" variant="soft" color="default">
            ${plan.inputs.budget} budget
          </Chip>
        </div>
      </div>

      {plan.recommendedCourses.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-zinc-900">Recommended courses</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {plan.recommendedCourses.map((c) => (
              <RecommendedCourseCard key={c._id} course={c} />
            ))}
          </div>
        </section>
      )}

      {sortedMilestones.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-zinc-900">Weekly roadmap &amp; milestones</h3>
          <ol className="mt-4 flex flex-col gap-4">
            {sortedMilestones.map((m, i) => (
              <li key={`${m.order}-${m.title}`} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold text-zinc-900">{m.title}</h4>
                      <span className="text-xs text-zinc-400">
                        ~{m.estimatedWeeks} wk · {m.estimatedHours}h
                      </span>
                    </div>
                    <p className="mt-1 text-base text-zinc-600">{m.description}</p>
                    {m.courses.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.courses.map((c) => (
                          <Link
                            key={c._id}
                            href={`/courses/${c.slug}`}
                            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
                          >
                            {c.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {plan.risks.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <TriangleAlert size={16} />
              Risks to watch
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {plan.risks.map((r) => (
                <li key={r} className="text-sm text-amber-900/80">
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        {plan.nextActions.length > 0 && (
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
              <ListChecks size={16} />
              Next actions
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {plan.nextActions.map((a) => (
                <li key={a} className="flex items-start gap-2 text-sm text-indigo-900/80">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <RefreshCw size={16} className="text-indigo-600" />
          Refine this plan
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Tell the planner what to change — it&apos;ll regenerate the plan using your feedback.
        </p>
        <form onSubmit={handleRefine} className="mt-4 flex flex-col gap-3">
          <TextArea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Add more hands-on projects, or lower the weekly time commitment"
            fullWidth
            maxLength={1000}
            disabled={refinePlan.isPending}
            className="min-h-[100px] resize-y"
          />
          {refinePlan.isError && (
            <p className="text-sm text-red-600">
              {isUnconfiguredError(refinePlan.error)
                ? "The AI Study Planner isn't configured yet — ask an admin to set OPENAI_API_KEY."
                : getErrorMessage(refinePlan.error, "Couldn't refine the plan.")}
            </p>
          )}
          <div>
            <Button
              type="submit"
              variant="primary"
              isDisabled={refinePlan.isPending || feedback.trim().length === 0}
              aria-busy={refinePlan.isPending}
            >
              {refinePlan.isPending && <Loader2 size={16} className="mr-1.5 inline animate-spin" />}
              {refinePlan.isPending ? "Refining…" : "Regenerate with feedback"}
            </Button>
          </div>
        </form>

        {plan.feedbackHistory.length > 0 && (
          <div className="mt-6 border-t border-zinc-100 pt-5">
            <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              <History size={14} />
              Refinement history
            </h4>
            <ol className="mt-3 flex flex-col gap-3">
              {plan.feedbackHistory.map((entry, i) => (
                <li key={`${entry.requestedAt}-${i}`} className="flex gap-3 text-sm">
                  <Chip size="sm" variant="soft" color="default" className="shrink-0">
                    v{i + 2}
                  </Chip>
                  <div>
                    <p className="text-zinc-700">{entry.feedback}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{formatDate(entry.requestedAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}

function PlanDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
        <div className="h-6 w-1/2 rounded bg-zinc-100" />
        <div className="mt-4 h-4 w-full rounded bg-zinc-100" />
        <div className="mt-2 h-4 w-2/3 rounded bg-zinc-100" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-20 rounded-xl bg-zinc-100" />
        <div className="h-20 rounded-xl bg-zinc-100" />
      </div>
    </div>
  );
}

function GenerateForm({ onCreated }: { onCreated: (planId: string) => void }) {
  const createPlan = useCreateStudyPlan();
  const [goal, setGoal] = useState("");
  const [skillLevel, setSkillLevel] = useState<CourseLevel | "">("");
  const [weeklyHours, setWeeklyHours] = useState("5");
  const [budget, setBudget] = useState("0");
  const [timeframeWeeks, setTimeframeWeeks] = useState("8");
  const [preferredTopics, setPreferredTopics] = useState<string[]>([]);
  const isSubmittingRef = useRef(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmittingRef.current || createPlan.isPending) return;
    isSubmittingRef.current = true;
    createPlan.mutate(
      {
        goal,
        skillLevel: skillLevel as CourseLevel,
        weeklyHours: Number(weeklyHours),
        budget: Number(budget),
        timeframeWeeks: Number(timeframeWeeks),
        preferredTopics: preferredTopics.map((t) => t.trim()).filter(Boolean),
      },
      {
        onSuccess: (data) => onCreated(data.studyPlan._id),
        onSettled: () => {
          isSubmittingRef.current = false;
        },
      }
    );
  }

  if (createPlan.isPending) {
    return <GenerationProgress />;
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
        <Sparkles size={18} className="text-indigo-600" />
        Generate a new plan
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Tell us your goal and constraints — we&apos;ll build a roadmap from real courses in the catalog.
      </p>

      {createPlan.isError && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {isUnconfiguredError(createPlan.error)
            ? "The AI Study Planner isn't configured yet — ask an admin to set OPENAI_API_KEY."
            : getErrorMessage(createPlan.error, "Couldn't generate a study plan.")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <label className={fieldLabel}>
          Goal
          <TextArea
            required
            rows={5}
            maxLength={500}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Become a job-ready frontend engineer specializing in React and Next.js"
            fullWidth
            disabled={createPlan.isPending}
            className="min-h-[130px] resize-y"
          />
        </label>

        <label className={fieldLabel}>
          Current skill level
          <select
            required
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value as CourseLevel)}
            className={selectClass}
            disabled={createPlan.isPending}
          >
            <option value="" disabled>
              Select a level
            </option>
            {COURSE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABEL[l]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className={fieldLabel}>
            Hours per week
            <Input
              type="number"
              required
              min={1}
              max={80}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              fullWidth
              disabled={createPlan.isPending}
            />
          </label>
          <label className={fieldLabel}>
            Timeframe (weeks)
            <Input
              type="number"
              required
              min={1}
              max={104}
              value={timeframeWeeks}
              onChange={(e) => setTimeframeWeeks(e.target.value)}
              fullWidth
              disabled={createPlan.isPending}
            />
          </label>
        </div>

        <label className={fieldLabel}>
          Budget (USD)
          <Input
            type="number"
            required
            min={0}
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            fullWidth
            disabled={createPlan.isPending}
          />
          <span className={helperText}>Enter 0 to only consider free courses.</span>
        </label>

        <label className={fieldLabel}>
          Preferred topics
          <TagInput
            value={preferredTopics}
            onChange={setPreferredTopics}
            placeholder="Type a topic and press Enter"
          />
          <span className={helperText}>Optional — helps steer course selection.</span>
        </label>

        <Button
          type="submit"
          variant="primary"
          isDisabled={createPlan.isPending}
          fullWidth
          aria-busy={createPlan.isPending}
        >
          {createPlan.isPending && <Loader2 size={16} className="mr-1.5 inline animate-spin" />}
          {createPlan.isPending ? "Generating…" : "Generate study plan"}
        </Button>
      </form>
    </div>
  );
}

function PreviousPlansSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-2">
      <div className="h-16 rounded-xl bg-zinc-100" />
      <div className="h-16 rounded-xl bg-zinc-100" />
      <div className="h-16 rounded-xl bg-zinc-100" />
    </div>
  );
}

export default function StudyPlanPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.replace("/login?redirectTo=/dashboard/study-plan");
    }
  }, [isSessionPending, session, router]);

  const myPlans = useMyStudyPlans();
  const config = useStudyPlanConfig();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const selectedPlan = useStudyPlan(selectedPlanId);

  if (isSessionPending || !session?.user) {
    return null;
  }

  const plans = myPlans.data?.items ?? [];

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 xl:px-12">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-zinc-900 xl:text-4xl">
            <Sparkles className="text-indigo-600" size={28} />
            AI Study Planner
          </h1>
          <p className="mt-1 text-base text-zinc-500 xl:text-lg">
            A personalized roadmap built from courses actually available in the catalog.
          </p>
        </div>

        {config.data?.demoMode && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border-2 border-amber-300 bg-amber-100 px-4 py-3 shadow-sm">
            <FlaskConical size={22} className="shrink-0 text-amber-700" />
            <p className="text-sm font-medium text-amber-900 sm:text-base">
              <span className="font-bold">Demo AI Mode is on.</span> This plan is generated locally from the real
              course catalog — OpenAI is never contacted and no billing is used.
            </p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]">
          <div className="flex flex-col gap-8">
            <GenerateForm onCreated={setSelectedPlanId} />

            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <History size={16} className="text-indigo-600" />
                Previous plans
              </h2>

              <div className="mt-3">
                {myPlans.isLoading ? (
                  <PreviousPlansSkeleton />
                ) : myPlans.isError ? (
                  <EmptyState className="rounded-xl border border-zinc-200 bg-white p-4">
                    <TriangleAlert size={20} className="text-zinc-400" />
                    <p className="mt-2 text-sm font-medium text-zinc-900">Couldn&apos;t load your plans</p>
                    <Button variant="outline" size="sm" className="mt-3" onPress={() => myPlans.refetch()}>
                      Try again
                    </Button>
                  </EmptyState>
                ) : plans.length === 0 ? (
                  <EmptyState className="rounded-xl border border-dashed border-zinc-300 bg-white p-4">
                    <BookOpen size={20} className="text-zinc-300" />
                    <p className="mt-2 text-sm text-zinc-500">
                      No plans yet — fill out the form to generate your first one.
                    </p>
                  </EmptyState>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {plans.map((p) => (
                      <li key={p._id}>
                        <button
                          type="button"
                          onClick={() => setSelectedPlanId(p._id)}
                          className={`w-full rounded-xl border p-3.5 text-left transition ${
                            selectedPlanId === p._id
                              ? "border-indigo-400 bg-indigo-50/60"
                              : "border-zinc-200 bg-white hover:border-indigo-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="line-clamp-2 text-sm font-semibold text-zinc-900">
                              {p.title}
                            </span>
                            <Chip size="sm" variant="soft" color="default" className="shrink-0">
                              v{p.version}
                            </Chip>
                          </div>
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-zinc-400">
                            <Wallet size={12} />
                            {p.inputs.timeframeWeeks} wks · {p.inputs.weeklyHours} hrs/wk
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
                            <CalendarClock size={12} />
                            {formatDate(p.generatedAt)}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div>
            {selectedPlanId && selectedPlan.isLoading ? (
              <PlanDetailSkeleton />
            ) : selectedPlanId && selectedPlan.isError ? (
              <EmptyState className="rounded-2xl border border-zinc-200 bg-white p-8">
                <TriangleAlert size={28} className="text-zinc-400" />
                <p className="mt-3 font-medium text-zinc-900">Couldn&apos;t load this plan</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {getErrorMessage(selectedPlan.error, "Something went wrong reaching the server.")}
                </p>
                <Button variant="outline" size="sm" className="mt-4" onPress={() => selectedPlan.refetch()}>
                  Try again
                </Button>
              </EmptyState>
            ) : selectedPlanId && selectedPlan.data ? (
              <PlanDetail plan={selectedPlan.data.studyPlan} />
            ) : (
              <EmptyState className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10">
                <Sparkles size={28} className="text-zinc-300" />
                <p className="mt-3 font-medium text-zinc-900">No plan selected</p>
                <p className="mt-1 max-w-sm text-center text-sm text-zinc-500">
                  Generate a new plan or pick one from your previous plans to see its roadmap here.
                </p>
              </EmptyState>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
