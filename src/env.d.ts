/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYNC_TRANSPORT?: 'local' | 'onec';
  readonly VITE_AUTH_TRANSPORT?: 'demo' | 'onec';
  readonly VITE_ONEC_BASE_URL?: string;
  readonly VITE_APP_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
