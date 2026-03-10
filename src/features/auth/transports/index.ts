import { authTransportConfig } from './config';
import { demoAuthTransport } from './demo-auth-transport';
import { OneCAuthTransport } from './onec-auth-transport';
import type { AuthTransport } from './types';

export { authTransportConfig } from './config';
export { demoAuthTransport } from './demo-auth-transport';
export { OneCAuthTransport } from './onec-auth-transport';
export type { AuthTransport, AuthTransportError } from './types';

export const createAuthTransport = (): AuthTransport => {
  if (authTransportConfig.transport === 'onec') {
    return new OneCAuthTransport({ baseUrl: authTransportConfig.onecBaseUrl });
  }

  return demoAuthTransport;
};
