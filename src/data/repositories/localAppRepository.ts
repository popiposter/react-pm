import {
  getTasks,
  getTimesheetByDate,
  getTimesheets,
  saveTimesheet,
  type Timesheet,
} from '../../api/mockBackend';
import type { AppRepository } from './types';

const localTasksRepository = {
  getTasks,
};

const localTimesheetsRepository = {
  getTimesheets,
  getTimesheetByDate,
  saveTimesheet(timesheet: Timesheet) {
    return saveTimesheet(timesheet);
  },
};

export const localAppRepository: AppRepository = {
  tasks: localTasksRepository,
  timesheets: localTimesheetsRepository,
};
