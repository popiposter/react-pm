import type { Task, Timesheet } from '../../api/mockBackend';

export interface SaveTimesheetError {
  status?: number;
  message?: string;
}

export type SyncOperationType = 'save_timesheet';

export interface SyncQueueItem {
  id: string;
  entityId: string;
  entityType: 'timesheet';
  operation: SyncOperationType;
  queuedAt: string;
}

export interface TimesheetSyncState {
  timesheetId: string;
  status: 'pending_sync' | 'synced';
  updatedAt: string;
}

export interface SyncStatus {
  pendingCount: number;
  lastQueuedAt: string | null;
}

export interface TaskRepository {
  getTasks(): Promise<Task[]>;
}

export interface TimesheetRepository {
  getTimesheets(month: string): Promise<Timesheet[]>;
  getTimesheetByDate(date: string): Promise<Timesheet | null>;
  saveTimesheet(timesheet: Timesheet): Promise<Timesheet>;
}

export interface SyncRepository {
  getStatus(): Promise<SyncStatus>;
}

export interface AppRepository {
  tasks: TaskRepository;
  timesheets: TimesheetRepository;
  sync: SyncRepository;
}
