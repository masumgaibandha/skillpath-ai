export default function LoginLoading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm animate-pulse rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="h-7 w-32 rounded-md bg-zinc-200" />
        <div className="mt-2 h-4 w-48 rounded bg-zinc-100" />
        <div className="mt-6 flex flex-col gap-4">
          <div className="h-11 w-full rounded-md bg-zinc-100" />
          <div className="h-11 w-full rounded-md bg-zinc-100" />
          <div className="h-11 w-full rounded-md bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
