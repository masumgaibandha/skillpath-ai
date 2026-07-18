import type { Metadata } from "next";
import { ExploreClient } from "./ExploreClient";
import { fetchServerApi } from "@/lib/api";
import { buildCourseQueryString } from "@/lib/courseQueryString";
import type { CourseListResponse, CourseQueryParams, CourseSort } from "@/lib/types";

export const metadata: Metadata = {
  title: "Explore Courses — SkillPath AI",
  description: "Search and filter real, published courses across every category and skill level.",
};

const PAGE_SIZE = 12;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const get = (key: string) => (Array.isArray(sp[key]) ? sp[key]![0] : sp[key]);

  const initialParams: CourseQueryParams = {
    page: get("page") ? Number(get("page")) : 1,
    limit: PAGE_SIZE,
    sort: (get("sort") as CourseSort) || "newest",
  };
  if (get("search")) initialParams.search = get("search");
  if (get("category")) initialParams.category = get("category");
  if (get("level")) initialParams.level = get("level") as CourseQueryParams["level"];
  if (get("minPrice")) initialParams.minPrice = Number(get("minPrice"));
  if (get("maxPrice")) initialParams.maxPrice = Number(get("maxPrice"));
  if (get("isFree")) initialParams.isFree = get("isFree") === "true";

  const queryString = buildCourseQueryString(initialParams);
  const initialData = await fetchServerApi<CourseListResponse>(`/api/courses?${queryString}`);

  return <ExploreClient initialParams={initialParams} initialData={initialData} />;
}
