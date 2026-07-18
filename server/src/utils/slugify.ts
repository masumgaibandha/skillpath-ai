import Course from "../models/Course.js";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Appends -2, -3, ... until the slug is free, so titles can collide safely. */
export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "course";
  let slug = base;
  let suffix = 2;
  while (await Course.exists({ slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}
