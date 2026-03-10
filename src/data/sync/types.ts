import type { Timesheet } from '../../api/mockBackend';
import type { SyncQueueItem } from '../repositories';

export interface SyncTransport {
  pushTimesheet(timesheet: Timesheet, operation: SyncQueueItem['operation']): Promise<void>;
}
