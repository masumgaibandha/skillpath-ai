export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6">
      <div className="h-9 w-64 rounded-md bg-zinc-200" />
      <div className="mt-2 h-4 w-72 rounded bg-zinc-100" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-zinc-200 bg-zinc-50" />
        ))}
      </div>
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div className="h-64 rounded-2xl border border-zinc-200 bg-zinc-50" />
          <div className="h-64 rounded-2xl border border-zinc-200 bg-zinc-50" />
        </div>
        <div className="h-48 rounded-2xl border border-zinc-200 bg-zinc-50" />
      </div>
    </div>
  );
}
