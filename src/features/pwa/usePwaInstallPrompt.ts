import { useCallback, useEffect, useMemo, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

const getIsStandalone = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

export const usePwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => getIsStandalone());

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      setIsInstalled(getIsStandalone());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return null;
    }

    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return result;
  }, [deferredPrompt]);

  return useMemo(
    () => ({
      canInstall: deferredPrompt !== null && !isInstalled,
      isInstalled,
      promptInstall,
    }),
    [deferredPrompt, isInstalled, promptInstall]
  );
};
