import { useEffect, useState, type ReactNode } from 'react';
import { useBlocker } from '@tanstack/react-router';

type DirtyChangeEvent = CustomEvent<{ isDirty: boolean; date: string }>;

function BlockerModal({
  opened,
  onConfirm,
  onCancel,
}: {
  opened: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!opened) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-[0_25px_80px_-50px_rgba(15,23,42,1)]">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-white">У вас есть несохраненные изменения</h3>
          <p className="text-sm leading-6 text-slate-300">
            Если вы уйдете со страницы, изменения будут потеряны. Можно сначала сохранить табель
            и затем продолжить переход.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
          >
            Сохранить и уйти
          </button>
        </div>
      </div>
    </div>
  );
}

export function NavigationBlocker({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const [currentTimesheetDate, setCurrentTimesheetDate] = useState<string | null>(null);

  useEffect(() => {
    const handleDirtyChange = (event: Event) => {
      const customEvent = event as DirtyChangeEvent;
      const nextIsDirty = customEvent.detail.isDirty;
      const nextDate = customEvent.detail.date;

      setIsDirty(nextIsDirty);
      setCurrentTimesheetDate(nextIsDirty && nextDate ? nextDate : null);
    };

    window.addEventListener('timesheet-dirty-change', handleDirtyChange);
    return () => window.removeEventListener('timesheet-dirty-change', handleDirtyChange);
  }, []);

  const blocker = useBlocker({
    shouldBlockFn: ({ current, next }) =>
      isDirty &&
      currentTimesheetDate !== null &&
      current.pathname !== next.pathname,
    enableBeforeUnload: () => isDirty,
    withResolver: true,
  });

  const handleConfirm = () => {
    window.dispatchEvent(new CustomEvent('timesheet-save-and-navigate'));
    blocker.proceed?.();
  };

  const handleCancel = () => {
    blocker.reset?.();
  };

  return (
    <>
      {children}
      <BlockerModal
        opened={blocker.status === 'blocked'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
