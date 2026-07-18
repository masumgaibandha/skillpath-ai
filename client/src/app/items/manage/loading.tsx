export default function ManageCoursesLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-9 w-48 rounded-md bg-zinc-200" />
          <div className="mt-2 h-4 w-56 rounded bg-zinc-100" />
        </div>
        <div className="h-10 w-32 rounded-md bg-zinc-200" />
      </div>
      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center"
          >
            <div className="h-24 w-full shrink-0 rounded-lg bg-zinc-100 sm:h-20 sm:w-32" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 rounded-full bg-zinc-100" />
              <div className="h-4 w-2/3 rounded bg-zinc-100" />
              <div className="h-3 w-1/3 rounded bg-zinc-100" />
            </div>
            <div className="flex shrink-0 gap-2">
              <div className="h-9 w-20 rounded-md bg-zinc-100" />
              <div className="h-9 w-20 rounded-md bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
