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

function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function tagsToArray(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

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
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<CourseLevel | "">("");
  const [price, setPrice] = useState("0");
  const [durationHours, setDurationHours] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [tags, setTags] = useState("");
  const [whatYoullLearn, setWhatYoullLearn] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [images, setImages] = useState("");

  function resetForm() {
    setTitle("");
    setShortDescription("");
    setFullDescription("");
    setCategory("");
    setLevel("");
    setPrice("0");
    setDurationHours("");
    setInstructorName("");
    setTags("");
    setWhatYoullLearn("");
    setPrerequisites("");
    setImages("");
    setImagesError(null);
    createCourse.reset();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImagesError(null);

    const imageUrls = linesToArray(images);
    if (imageUrls.length < 2 || imageUrls.length > 4) {
      setImagesError("Enter between 2 and 4 image URLs, one per line.");
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
        tags: tagsToArray(tags),
        whatYoullLearn: linesToArray(whatYoullLearn),
        prerequisites: linesToArray(prerequisites),
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
        <div className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-10 text-center">
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
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
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

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Title
          <Input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Short description
          <TextArea
            required
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="1-2 sentences shown on course cards"
            fullWidth
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Category
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
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

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Level
            <select
              required
              value={level}
              onChange={(e) => setLevel(e.target.value as CourseLevel)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
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

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Price (USD, 0 = free)
            <Input
              type="number"
              required
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              fullWidth
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
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

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Instructor name
          <Input
            type="text"
            required
            value={instructorName}
            onChange={(e) => setInstructorName(e.target.value)}
            fullWidth
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Tags (comma-separated)
          <Input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, frontend, javascript"
            fullWidth
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          What you&apos;ll learn (one per line)
          <TextArea
            rows={4}
            value={whatYoullLearn}
            onChange={(e) => setWhatYoullLearn(e.target.value)}
            fullWidth
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Prerequisites (one per line)
          <TextArea
            rows={3}
            value={prerequisites}
            onChange={(e) => setPrerequisites(e.target.value)}
            fullWidth
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Image URLs (one per line, 2–4 required)
          <TextArea
            required
            rows={3}
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder={"https://images.unsplash.com/...\nhttps://images.unsplash.com/..."}
            fullWidth
          />
          {imagesError && <span className="text-sm text-red-600">{imagesError}</span>}
        </label>

        <Button type="submit" variant="primary" isDisabled={createCourse.isPending} fullWidth>
          {createCourse.isPending ? "Creating…" : "Create course"}
        </Button>
      </form>
    </div>
  );
}
