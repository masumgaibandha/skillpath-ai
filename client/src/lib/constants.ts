// Matches the categories used in server/src/data/courses.seed-data.ts.
// No dedicated /api/categories endpoint exists yet, so this is hardcoded
// rather than derived at request time — acceptable for the fixed seed
// catalog this MVP ships with.
export const COURSE_CATEGORIES = [
  "Web Development",
  "Data Science",
  "UI/UX Design",
  "Digital Marketing",
  "Cloud & DevOps",
  "Cybersecurity",
  "Project Management",
  "Personal Finance & Investing",
  "Mobile App Development",
  "Photography",
  "Content Writing & Copywriting",
  "Artificial Intelligence & Machine Learning",
] as const;

export const SORT_LABELS: Record<string, string> = {
  newest: "Newest",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  rating: "Highest Rated",
};
