export function RoutePending({ label = 'Подготавливаем экран...' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_25px_80px_-50px_rgba(15,23,42,0.95)]">
        <div className="space-y-4">
          <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
          <div className="h-9 w-3/4 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-5 w-full animate-pulse rounded-xl bg-white/5" />
          <div className="h-5 w-4/5 animate-pulse rounded-xl bg-white/5" />
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
