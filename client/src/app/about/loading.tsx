export default function AboutLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-16 sm:px-6">
      <div className="h-9 w-72 max-w-full rounded-md bg-zinc-200" />
      <div className="mt-4 h-5 w-full max-w-2xl rounded-md bg-zinc-100" />
      <div className="mt-2 h-5 w-2/3 max-w-xl rounded-md bg-zinc-100" />

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-xl border border-zinc-200 bg-zinc-50" />
        <div className="h-24 rounded-xl border border-zinc-200 bg-zinc-50" />
        <div className="h-24 rounded-xl border border-zinc-200 bg-zinc-50" />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div className="aspect-[4/3] rounded-2xl bg-zinc-100" />
        <div className="flex flex-col gap-3">
          <div className="h-5 w-48 rounded bg-zinc-200" />
          <div className="h-4 w-full rounded bg-zinc-100" />
          <div className="h-4 w-full rounded bg-zinc-100" />
          <div className="h-4 w-2/3 rounded bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
