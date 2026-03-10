import type { Timesheet } from '../../api/mockBackend';
import type { SyncTransport } from './types';
import type { SyncQueueItem } from '../repositories';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const localSyncTransport: SyncTransport = {
  async pushTimesheet(timesheet: Timesheet, operation: SyncQueueItem['operation']) {
    void timesheet;
    void operation;
    await delay(180);
  },
};
