export default function AddCourseLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-16 sm:px-6">
      <div className="h-9 w-56 rounded-md bg-zinc-200" />
      <div className="mt-2 h-4 w-80 max-w-full rounded bg-zinc-100" />
      <div className="mt-8 flex flex-col gap-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="h-4 w-40 rounded bg-zinc-200" />
            <div className="h-11 w-full rounded-md bg-zinc-100" />
            <div className="h-11 w-full rounded-md bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
