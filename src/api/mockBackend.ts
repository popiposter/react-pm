// Types
export interface Task {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
}

export interface TimesheetRow {
  id: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // in minutes
  description?: string;
}

export interface Timesheet {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  version: number;
  rows: TimesheetRow[];
  status: 'draft' | 'submitted' | 'approved';
}

// Mock data storage keys
const TASKS_KEY = 'mock_tasks';
const TIMESHEETS_KEY = 'mock_timesheets';

// Initialize mock data if not exists
const initializeMockData = () => {
  if (!localStorage.getItem(TASKS_KEY)) {
    const mockTasks: Task[] = [
      { id: 'task1', title: 'Разработка фронтенда', projectId: 'proj1', projectName: 'Внутренний портал' },
      { id: 'task2', title: 'Разработка бэкенда', projectId: 'proj1', projectName: 'Внутренний портал' },
      { id: 'task3', title: 'Тестирование', projectId: 'proj1', projectName: 'Внутренний портал' },
      { id: 'task4', title: 'Дизайн интерфейса', projectId: 'proj2', projectName: 'Мобильное приложение' },
      { id: 'task5', title: 'Интеграция API', projectId: 'proj2', projectName: 'Мобильное приложение' },
      { id: 'task6', title: 'Подготовка документации', projectId: 'proj3', projectName: 'CRM система' },
    ];
    localStorage.setItem(TASKS_KEY, JSON.stringify(mockTasks));
  }

  if (!localStorage.getItem(TIMESHEETS_KEY)) {
    localStorage.setItem(TIMESHEETS_KEY, JSON.stringify({}));
  }
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Functions
export const getTasks = async (): Promise<Task[]> => {
  await delay(300); // Simulate network delay
  initializeMockData();

  const tasks = localStorage.getItem(TASKS_KEY);
  return tasks ? JSON.parse(tasks) : [];
};

export const getTimesheets = async (month: string): Promise<Timesheet[]> => {
  await delay(500); // Simulate network delay
  initializeMockData();

  const timesheetsData = localStorage.getItem(TIMESHEETS_KEY);
  const allTimesheets = timesheetsData ? JSON.parse(timesheetsData) : {};

  // Filter timesheets for the requested month
  return (Object.values(allTimesheets) as Timesheet[]).filter((ts) =>
    ts.date.startsWith(month)
  );
};

export const getTimesheet = async (id: string): Promise<Timesheet | null> => {
  await delay(300); // Simulate network delay
  initializeMockData();

  const timesheetsData = localStorage.getItem(TIMESHEETS_KEY);
  const allTimesheets = timesheetsData ? JSON.parse(timesheetsData) : {};

  return allTimesheets[id] || null;
};

export const getTimesheetByDate = async (date: string): Promise<Timesheet | null> => {
  await delay(300); // Simulate network delay
  initializeMockData();

  const timesheetsData = localStorage.getItem(TIMESHEETS_KEY);
  const allTimesheets = timesheetsData ? JSON.parse(timesheetsData) : {};

  // Find timesheet for the specific date
  for (const ts of Object.values(allTimesheets) as Timesheet[]) {
    if (ts.date === date) {
      return ts;
    }
  }

  // If not found, create a new draft timesheet
  return {
    id: `ts_${date}`,
    date,
    userId: 'current_user',
    version: 1,
    rows: [],
    status: 'draft'
  };
};

export const saveTimesheet = async (timesheet: Timesheet): Promise<Timesheet> => {
  await delay(600); // Simulate network delay
  initializeMockData();

  const timesheetsData = localStorage.getItem(TIMESHEETS_KEY);
  const allTimesheets = timesheetsData ? JSON.parse(timesheetsData) : {};

  // Check for conflict
  const existingTimesheet = allTimesheets[timesheet.id];
  if (existingTimesheet && timesheet.version < existingTimesheet.version) {
    throw {
      status: 409,
      message: 'Conflict: A newer version exists on the server'
    };
  }

  // Save the timesheet with incremented version
  const newVersion = existingTimesheet ? existingTimesheet.version + 1 : 1;
  const savedTimesheet = {
    ...timesheet,
    version: newVersion
  };

  allTimesheets[timesheet.id] = savedTimesheet;
  localStorage.setItem(TIMESHEETS_KEY, JSON.stringify(allTimesheets));

  return savedTimesheet;
};

// Initialize mock data on module load
initializeMockData();