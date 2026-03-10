import type { Timesheet } from '../../api/mockBackend';
import type { SyncQueueItem } from '../repositories';
import type { SyncTransport } from './types';

interface OneCSyncTransportOptions {
  baseUrl: string | null;
}

export class OneCSyncTransport implements SyncTransport {
  constructor(private readonly options: OneCSyncTransportOptions) {}

  async pushTimesheet(timesheet: Timesheet, operation: SyncQueueItem['operation']) {
    void timesheet;
    void operation;
    if (!this.options.baseUrl) {
      return {
        ok: false,
        errorCode: 'transport_not_configured',
        message: 'OneC transport is not configured yet.',
      };
    }

    return {
      ok: false,
      errorCode: 'transport_not_implemented',
      message: `OneC transport stub is configured for ${this.options.baseUrl}, but real sync is not implemented yet.`,
    };
  }
}
