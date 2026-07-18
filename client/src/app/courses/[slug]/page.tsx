import { Chip } from "@heroui/react";
import { BookOpen, Check, Clock, Star, User } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/CourseCard";
import { CourseImage } from "@/components/CourseImage";
import { EnrollAction } from "@/components/EnrollAction";
import type { CourseDetailResponse } from "@/lib/types";

const SERVER_API_URL = process.env.API_URL ?? "http://localhost:5000";

async function getCourse(slug: string): Promise<CourseDetailResponse> {
  const res = await fetch(`${SERVER_API_URL}/api/courses/${slug}`, { cache: "no-store" });
  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`Failed to load course "${slug}" (status ${res.status})`);
  }
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { course } = await getCourse(slug);
    return { title: `${course.title} — SkillPath AI`, description: course.shortDescription };
  } catch {
    return { title: "Course — SkillPath AI" };
  }
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { course, relatedCourses } = await getCourse(slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>{course.category}</span>
        <span>/</span>
        <span>{LEVEL_LABEL[course.level]}</span>
      </div>
      <h1 className="mt-2 text-3xl font-bold text-zinc-900 sm:text-4xl">{course.title}</h1>
      <p className="mt-3 max-w-3xl text-lg text-zinc-600">{course.shortDescription}</p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-600">
        <span className="flex items-center gap-1.5">
          <User size={16} />
          {course.instructorName}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={16} />
          {course.durationHours} hours
        </span>
        <span className="flex items-center gap-1.5">
          <Star size={16} className="fill-amber-400 text-amber-400" />
          {course.rating.toFixed(1)} ({course.ratingCount} ratings)
        </span>
      </div>

      {/* Image gallery */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {course.images.map((src, i) => (
          <div
            key={src}
            className={`relative aspect-video overflow-hidden rounded-xl bg-zinc-100 ${
              i === 0 ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2" : ""
            }`}
          >
            <CourseImage src={src} alt={`${course.title} — image ${i + 1}`} />
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main content */}
        <div className="flex flex-col gap-10 lg:col-span-2">
          <section>
            <h2 className="text-xl font-semibold text-zinc-900">Overview</h2>
            <p className="mt-3 whitespace-pre-line text-zinc-600">{course.fullDescription}</p>
          </section>

          {course.whatYoullLearn.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">What you&apos;ll learn</h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {course.whatYoullLearn.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-indigo-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.prerequisites.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-zinc-900">Prerequisites</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {course.prerequisites.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-zinc-600">
                    <BookOpen size={16} className="mt-0.5 shrink-0 text-zinc-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Key info sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <div className="flex items-baseline justify-between">
              {course.isFree ? (
                <Chip color="accent" variant="soft">
                  Free
                </Chip>
              ) : (
                <span className="text-3xl font-bold text-zinc-900">
                  ${course.price.toFixed(2)}
                </span>
              )}
            </div>

            <div className="mt-4">
              <EnrollAction course={course} />
            </div>

            <dl className="mt-6 flex flex-col gap-3 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Level</dt>
                <dd className="font-medium text-zinc-900">{LEVEL_LABEL[course.level]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Duration</dt>
                <dd className="font-medium text-zinc-900">{course.durationHours} hours</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Category</dt>
                <dd className="font-medium text-zinc-900">{course.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Instructor</dt>
                <dd className="font-medium text-zinc-900">{course.instructorName}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {relatedCourses.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-zinc-900">Related courses</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedCourses.map((related) => (
              <CourseCard key={related._id} course={related} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
