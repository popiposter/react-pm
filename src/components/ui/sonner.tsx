import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      theme="dark"
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            '!border-white/10 !bg-slate-900 !text-slate-100 !shadow-[0_20px_60px_-30px_rgba(15,23,42,0.95)]',
          title: '!text-slate-50',
          description: '!text-slate-300',
          actionButton: '!bg-sky-400 !text-slate-950',
          cancelButton: '!bg-white/10 !text-slate-100',
        },
      }}
    />
  );
}
