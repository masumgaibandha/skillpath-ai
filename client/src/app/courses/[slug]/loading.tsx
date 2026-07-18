export default function CourseDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
      <div className="mt-3 h-10 w-2/3 animate-pulse rounded-md bg-zinc-200" />
      <div className="mt-3 h-6 w-full max-w-2xl animate-pulse rounded-md bg-zinc-100" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 row-span-2 aspect-video animate-pulse rounded-xl bg-zinc-100" />
        <div className="aspect-video animate-pulse rounded-xl bg-zinc-100" />
        <div className="aspect-video animate-pulse rounded-xl bg-zinc-100" />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="h-24 w-full animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-64 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50" />
      </div>
    </div>
  );
}
