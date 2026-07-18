import type { CourseQueryParams } from "./types";

/** Shared by the server-fetched initial page and the client refetch hook so both hit the identical query. */
export function buildCourseQueryString(params: CourseQueryParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  if (params.category) search.set("category", params.category);
  if (params.level) search.set("level", params.level);
  if (params.minPrice !== undefined) search.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) search.set("maxPrice", String(params.maxPrice));
  if (params.isFree !== undefined) search.set("isFree", String(params.isFree));
  if (params.sort) search.set("sort", params.sort);
  return search.toString();
}
