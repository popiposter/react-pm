/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MODE?: 'demo' | 'prod';
  readonly VITE_ENABLE_DEMO_ROUTE?: 'true' | 'false';
  readonly VITE_ENABLE_DEMO_DATA_TOOLS?: 'true' | 'false';
  readonly VITE_ENABLE_DEMO_HINTS?: 'true' | 'false';
  readonly VITE_ENABLE_DEMO_BRANDING?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
