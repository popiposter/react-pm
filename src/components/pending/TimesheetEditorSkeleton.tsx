export function TimesheetEditorSkeleton() {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-7">
        <div className="space-y-4">
          <div className="h-7 w-40 animate-pulse rounded-full bg-sky-400/10" />
          <div className="h-12 w-2/3 animate-pulse rounded-3xl bg-white/10" />
          <div className="h-5 w-full animate-pulse rounded-xl bg-white/5" />
          <div className="flex flex-wrap gap-3">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-12 w-40 animate-pulse rounded-2xl bg-white/10"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4">
        <div className="h-5 w-56 animate-pulse rounded-xl bg-white/10" />
        <div className="mt-3 h-4 w-full animate-pulse rounded-xl bg-white/5" />
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded-xl bg-white/5" />
            <div className="h-10 w-60 animate-pulse rounded-2xl bg-white/10" />
          </div>
          <div className="h-12 w-40 animate-pulse rounded-2xl bg-white/10" />
        </div>
        <div className="mt-6 space-y-4">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/5"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
