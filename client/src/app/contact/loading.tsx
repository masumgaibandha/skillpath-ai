export default function ContactLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-4 py-16 sm:px-6">
      <div className="h-9 w-56 rounded-md bg-zinc-200" />
      <div className="mt-4 h-5 w-full max-w-xl rounded-md bg-zinc-100" />
      <div className="mt-6 h-4 w-48 rounded bg-zinc-100" />
      <div className="mt-10 flex flex-col gap-5">
        <div className="h-11 w-full rounded-md bg-zinc-100" />
        <div className="h-11 w-full rounded-md bg-zinc-100" />
        <div className="h-32 w-full rounded-md bg-zinc-100" />
        <div className="h-11 w-32 rounded-md bg-zinc-200" />
      </div>
    </div>
  );
}
