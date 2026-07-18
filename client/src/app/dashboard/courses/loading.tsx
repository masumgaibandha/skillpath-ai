export default function MyCoursesLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-9 w-48 rounded-md bg-zinc-200" />
          <div className="mt-2 h-4 w-56 rounded bg-zinc-100" />
        </div>
        <div className="h-10 w-40 rounded-md bg-zinc-200" />
      </div>
      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-zinc-100 p-4 last:border-0">
            <div className="h-11 w-14 shrink-0 rounded-md bg-zinc-100" />
            <div className="h-4 w-48 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
