import type { Timesheet } from '../../api/mockBackend';
import type { SyncQueueItem } from '../repositories';

export interface SyncTransportResult {
  ok: boolean;
  remoteVersion?: number;
  errorCode?: string;
  message?: string;
}

export interface SyncTransport {
  pushTimesheet(
    timesheet: Timesheet,
    operation: SyncQueueItem['operation']
  ): Promise<SyncTransportResult>;
}
