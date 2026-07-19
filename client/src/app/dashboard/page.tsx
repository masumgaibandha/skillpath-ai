"use client";

import { EmptyState } from "@heroui/react";
import {
  BookOpen,
  Compass,
  DollarSign,
  GraduationCap,
  LayoutGrid,
  MessageSquare,
  PlusCircle,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CourseCard, CourseCardSkeleton } from "@/components/CourseCard";
import { useMyCourses } from "@/hooks/useMyCourses";
import { useMyEnrollments } from "@/hooks/useMyEnrollments";
import { useMyStudyPlans } from "@/hooks/useMyStudyPlans";
import { authClient } from "@/lib/auth-client";
import type { Course, Enrollment } from "@/lib/types";

const CHART_COLORS = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

function getCourse(enrollment: Enrollment): Course | null {
  return typeof enrollment.courseId === "object" ? enrollment.courseId : null;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  caption,
  accent = "indigo",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: React.ReactNode;
  caption?: string;
  accent?: "indigo" | "amber" | "zinc";
}) {
  const accentClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    zinc: "bg-zinc-100 text-zinc-500",
  }[accent];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClasses}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-2xl font-bold text-zinc-900">{value}</p>
      <p className="mt-0.5 text-sm text-zinc-500">{label}</p>
      {caption && <p className="mt-1 text-xs text-zinc-400">{caption}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  useEffect(() => {
    if (!isSessionPending && !session?.user) {
      router.replace("/login?redirectTo=/dashboard");
    }
  }, [isSessionPending, session, router]);

  const enrollments = useMyEnrollments();
  const ownedCourses = useMyCourses();
  const studyPlans = useMyStudyPlans();

  const enrolledCount = enrollments.data?.items.length ?? 0;
  const ownedCount = ownedCourses.data?.items.length ?? 0;
  const studyPlanCount = studyPlans.data?.items.length ?? 0;
  const totalSpent = useMemo(
    () => (enrollments.data?.items ?? []).reduce((sum, e) => sum + (e.amountPaid || 0), 0),
    [enrollments.data]
  );
  const recentEnrollments = (enrollments.data?.items ?? []).slice(0, 3);

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const enrollment of enrollments.data?.items ?? []) {
      const course = getCourse(enrollment);
      if (!course) continue;
      counts.set(course.category, (counts.get(course.category) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [enrollments.data]);

  if (isSessionPending || !session?.user) {
    return null;
  }

  const firstName = (session.user.name || session.user.email || "there").split(" ")[0];
  const isLoading = enrollments.isLoading || ownedCourses.isLoading || studyPlans.isLoading;
  const isError = enrollments.isError || ownedCourses.isError;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Welcome back, {firstName}</h1>
        <p className="mt-1 text-zinc-500">Here&apos;s what&apos;s happening with your learning.</p>
      </div>

      {isError ? (
        <EmptyState className="mt-8 rounded-2xl border border-zinc-200 bg-white">
          <TriangleAlert size={32} className="text-zinc-400" />
          <p className="mt-3 font-medium text-zinc-900">Couldn&apos;t load your dashboard</p>
          <p className="mt-1 text-sm text-zinc-500">Something went wrong reaching the server.</p>
        </EmptyState>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50"
                />
              ))
            ) : (
              <>
                <SummaryCard icon={GraduationCap} label="Enrolled Courses" value={enrolledCount} />
                <SummaryCard icon={LayoutGrid} label="Owned Courses" value={ownedCount} />
                <SummaryCard icon={Sparkles} label="Study Plans" value={studyPlanCount} accent="amber" />
                <SummaryCard
                  icon={DollarSign}
                  label="Total Spending"
                  value={`$${totalSpent.toFixed(2)}`}
                />
              </>
            )}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="flex flex-col gap-8 lg:col-span-2">
              {/* Recent enrolled courses */}
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-900">Recent enrolled courses</h2>
                  {enrolledCount > 0 && (
                    <Link
                      href="/dashboard/courses"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      View all →
                    </Link>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {isLoading ? (
                    <>
                      <CourseCardSkeleton />
                      <CourseCardSkeleton />
                      <CourseCardSkeleton />
                    </>
                  ) : recentEnrollments.length > 0 ? (
                    recentEnrollments.map((enrollment) => {
                      const course = getCourse(enrollment);
                      return course ? <CourseCard key={enrollment._id} course={course} /> : null;
                    })
                  ) : (
                    <div className="col-span-full rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
                      <BookOpen size={28} className="mx-auto text-zinc-300" />
                      <p className="mt-3 text-sm font-medium text-zinc-900">
                        No enrollments yet
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Enroll in a course to see it here.
                      </p>
                      <Link
                        href="/explore"
                        className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        Explore courses
                      </Link>
                    </div>
                  )}
                </div>
              </section>

              {/* Analytics */}
              <section>
                <h2 className="text-lg font-semibold text-zinc-900">Enrollments by category</h2>
                <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
                  {isLoading ? (
                    <div className="h-64 animate-pulse rounded-lg bg-zinc-50" />
                  ) : categoryData.length > 0 ? (
                    <div className="h-64 w-full" role="img" aria-label="Bar chart of enrollments by course category">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
                          <XAxis
                            type="number"
                            allowDecimals={false}
                            tick={{ fontSize: 12, fill: "#71717a" }}
                            axisLine={{ stroke: "#e4e4e7" }}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="category"
                            width={140}
                            tick={{ fontSize: 12, fill: "#3f3f46" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "#f4f4f5" }}
                            contentStyle={{
                              borderRadius: 8,
                              border: "1px solid #e4e4e7",
                              fontSize: 13,
                            }}
                            formatter={(value) => [`${value} course${value === 1 ? "" : "s"}`, "Enrolled"]}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                            {categoryData.map((entry, index) => (
                              <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-10 text-center text-sm text-zinc-500">
                      Enroll in a course to see your category breakdown here.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Quick actions */}
            <aside>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-zinc-900">Quick actions</h2>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href="/explore"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <Compass size={16} className="text-indigo-600" />
                    Explore courses
                  </Link>
                  <Link
                    href="/dashboard/courses"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <GraduationCap size={16} className="text-indigo-600" />
                    View my courses
                  </Link>
                  <Link
                    href="/dashboard/study-plan"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <Sparkles size={16} className="text-indigo-600" />
                    AI Study Planner
                  </Link>
                  <Link
                    href="/dashboard/chat"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <MessageSquare size={16} className="text-indigo-600" />
                    AI Chat Assistant
                  </Link>
                  <Link
                    href="/items/add"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <PlusCircle size={16} className="text-indigo-600" />
                    Add a course
                  </Link>
                  <Link
                    href="/items/manage"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <LayoutGrid size={16} className="text-indigo-600" />
                    Manage my courses
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
