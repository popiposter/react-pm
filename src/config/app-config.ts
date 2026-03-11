export type AppMode = 'demo' | 'prod';

const parseBooleanFlag = (value: string | undefined): boolean | undefined => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
};

const envMode = import.meta.env.VITE_APP_MODE;
const mode: AppMode = envMode === 'prod' ? 'prod' : 'demo';
const demoDefaultsEnabled = mode === 'demo';

export const appConfig = {
  mode,
  isDemoMode: mode === 'demo',
  defaults: {
    username: mode === 'demo' ? 'demo.user' : '',
    password: mode === 'demo' ? 'demo' : '',
  },
  features: {
    demoRoute:
      parseBooleanFlag(import.meta.env.VITE_ENABLE_DEMO_ROUTE) ?? demoDefaultsEnabled,
    demoDataTools:
      parseBooleanFlag(import.meta.env.VITE_ENABLE_DEMO_DATA_TOOLS) ?? demoDefaultsEnabled,
    demoHints:
      parseBooleanFlag(import.meta.env.VITE_ENABLE_DEMO_HINTS) ?? demoDefaultsEnabled,
    demoBranding:
      parseBooleanFlag(import.meta.env.VITE_ENABLE_DEMO_BRANDING) ?? demoDefaultsEnabled,
  },
} as const;
