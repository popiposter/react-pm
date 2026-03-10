import type { Task, Timesheet } from '../../api/mockBackend';

export interface SaveTimesheetError {
  status?: number;
  message?: string;
}

export interface TaskRepository {
  getTasks(): Promise<Task[]>;
}

export interface TimesheetRepository {
  getTimesheets(month: string): Promise<Timesheet[]>;
  getTimesheetByDate(date: string): Promise<Timesheet | null>;
  saveTimesheet(timesheet: Timesheet): Promise<Timesheet>;
}

export interface AppRepository {
  tasks: TaskRepository;
  timesheets: TimesheetRepository;
}
