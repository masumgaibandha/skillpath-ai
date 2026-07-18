"use client";

import { Button, Input, TextArea } from "@heroui/react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { COURSE_CATEGORIES } from "@/lib/constants";
import { ApiError } from "@/lib/api";
import { COURSE_LEVELS } from "@/lib/types";
import type { Course, CourseLevel } from "@/lib/types";
import { useCreateCourse } from "@/hooks/useCreateCourse";
import { ImageUrlListInput } from "@/components/ImageUrlListInput";
import { ListInput } from "@/components/ListInput";
import { TagInput } from "@/components/TagInput";

function nonEmpty(items: string[]): string[] {
  return items.map((i) => i.trim()).filter(Boolean);
}

function SectionCard({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
          {step}
        </span>
        <div>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-5">{children}</div>
    </section>
  );
}

const fieldLabel = "flex flex-col gap-1.5 text-sm font-medium text-zinc-700";
const selectClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
const helperText = "text-xs font-normal text-zinc-400";

export default function AddCoursePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login?redirectTo=/items/add");
    }
  }, [isPending, session, router]);

  const createCourse = useCreateCourse();
  const [createdCourse, setCreatedCourse] = useState<Course | null>(null);
  const [imagesError, setImagesError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<CourseLevel | "">("");
  const [price, setPrice] = useState("0");
  const [durationHours, setDurationHours] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [whatYoullLearn, setWhatYoullLearn] = useState<string[]>([]);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>(["", ""]);

  function resetForm() {
    setTitle("");
    setShortDescription("");
    setFullDescription("");
    setInstructorName("");
    setCategory("");
    setLevel("");
    setPrice("0");
    setDurationHours("");
    setTags([]);
    setWhatYoullLearn([]);
    setPrerequisites([]);
    setImages(["", ""]);
    setImagesError(null);
    createCourse.reset();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImagesError(null);

    const imageUrls = nonEmpty(images);
    if (imageUrls.length < 2 || imageUrls.length > 4) {
      setImagesError("Add between 2 and 4 image URLs.");
      return;
    }
    const invalidUrl = imageUrls.find((url) => {
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });
    if (invalidUrl) {
      setImagesError(`"${invalidUrl}" is not a valid URL.`);
      return;
    }

    createCourse.mutate(
      {
        title,
        shortDescription,
        fullDescription,
        category,
        level: level as CourseLevel,
        price: Number(price),
        durationHours: Number(durationHours),
        instructorName,
        tags: nonEmpty(tags),
        whatYoullLearn: nonEmpty(whatYoullLearn),
        prerequisites: nonEmpty(prerequisites),
        images: imageUrls,
      },
      { onSuccess: (data) => setCreatedCourse(data.course) }
    );
  }

  if (isPending || !session?.user) {
    return null;
  }

  if (createdCourse) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <CheckCircle2 className="text-indigo-600" size={40} />
          <p className="mt-4 text-lg font-semibold text-zinc-900">Course created</p>
          <p className="mt-1 text-zinc-500">
            &ldquo;{createdCourse.title}&rdquo; is live and published to the catalog.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/courses/${createdCourse.slug}`}
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              View course
            </Link>
            <Link
              href="/items/manage"
              className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Manage my courses
            </Link>
            <Button variant="outline" onPress={resetForm}>
              Add another course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold text-zinc-900">Add a course</h1>
        <p className="mt-1 text-zinc-500">
          Published immediately to the public catalog — you can delete it later from{" "}
          <Link href="/items/manage" className="text-indigo-600 hover:text-indigo-700">
            My Courses
          </Link>
          .
        </p>

        {createCourse.isError && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            <div>
              <p>{createCourse.error.message}</p>
              {createCourse.error instanceof ApiError && createCourse.error.details && (
                <ul className="mt-1 list-inside list-disc">
                  {Object.entries(createCourse.error.details).map(([field, messages]) =>
                    messages?.map((m) => <li key={`${field}-${m}`}>{m}</li>)
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6 pb-4">
          <SectionCard
            step={1}
            title="Basic Information"
            description="Shown at the top of the course card and detail page."
          >
            <label className={fieldLabel}>
              Title
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
            </label>

            <label className={fieldLabel}>
              Short description
              <TextArea
                required
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="1-2 sentences shown on course cards"
                fullWidth
              />
              <span className={helperText}>
                Keep it brief — this appears on every course card in Explore.
              </span>
            </label>

            <label className={fieldLabel}>
              Full description
              <TextArea
                required
                rows={6}
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="Longer overview shown on the course detail page"
                fullWidth
              />
            </label>

            <label className={fieldLabel}>
              Instructor name
              <Input
                type="text"
                required
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                fullWidth
              />
            </label>
          </SectionCard>

          <SectionCard
            step={2}
            title="Pricing and Level"
            description="Powers Explore's price and level filters."
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className={fieldLabel}>
                Level
                <select
                  required
                  value={level}
                  onChange={(e) => setLevel(e.target.value as CourseLevel)}
                  className={selectClass}
                >
                  <option value="" disabled>
                    Select a level
                  </option>
                  {COURSE_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l[0]!.toUpperCase() + l.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <label className={fieldLabel}>
                Price (USD)
                <Input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  fullWidth
                />
                <span className={helperText}>Enter 0 for a free course.</span>
              </label>
            </div>
          </SectionCard>

          <SectionCard step={3} title="Course Details" description="Classification and search tags.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className={fieldLabel}>
                Category
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={selectClass}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {COURSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className={fieldLabel}>
                Duration (hours)
                <Input
                  type="number"
                  required
                  min={0}
                  step="0.5"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  fullWidth
                />
              </label>
            </div>

            <label className={fieldLabel}>
              Tags
              <TagInput value={tags} onChange={setTags} placeholder="Type a tag and press Enter" />
              <span className={helperText}>Used for search and related-course matching.</span>
            </label>
          </SectionCard>

          <SectionCard
            step={4}
            title="Learning Outcomes"
            description="Optional — shown as a checklist on the course detail page."
          >
            <ListInput
              value={whatYoullLearn}
              onChange={setWhatYoullLearn}
              placeholder="Build a REST API with Express"
              addLabel="Add outcome"
            />
          </SectionCard>

          <SectionCard step={5} title="Requirements" description="Optional — what learners should know first.">
            <ListInput
              value={prerequisites}
              onChange={setPrerequisites}
              placeholder="Basic JavaScript"
              addLabel="Add requirement"
            />
          </SectionCard>

          <SectionCard step={6} title="Images" description="2–4 images. The first becomes the cover image.">
            <ImageUrlListInput value={images} onChange={setImages} />
            {imagesError && <span className="text-sm text-red-600">{imagesError}</span>}
          </SectionCard>

          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg shadow-zinc-900/5 backdrop-blur">
            <p className="hidden text-sm text-zinc-500 sm:block">Ready to publish this course?</p>
            <Button
              type="submit"
              variant="primary"
              isDisabled={createCourse.isPending}
              fullWidth
              className="sm:w-auto sm:min-w-52 sm:flex-none"
            >
              {createCourse.isPending ? "Creating…" : "Create course"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
