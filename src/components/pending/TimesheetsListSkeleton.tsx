export function TimesheetsListSkeleton() {
  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-4">
            <div className="h-7 w-44 animate-pulse rounded-full bg-sky-400/10" />
            <div className="h-12 w-3/4 animate-pulse rounded-3xl bg-white/10" />
            <div className="h-5 w-full animate-pulse rounded-xl bg-white/5" />
            <div className="h-5 w-5/6 animate-pulse rounded-xl bg-white/5" />
            <div className="flex gap-3">
              <div className="h-12 w-52 animate-pulse rounded-2xl bg-white/10" />
              <div className="h-12 w-40 animate-pulse rounded-2xl bg-white/5" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.55fr_0.55fr]">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-12 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
