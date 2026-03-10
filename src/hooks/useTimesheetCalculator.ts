import { useState, useEffect, useCallback, useRef } from 'react';
import { TimesheetRow } from '../api/mockBackend';

export interface TimesheetCalculatorResult {
  rows: TimesheetRow[];
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;
  updateRow: (index: number, updatedRow: Partial<TimesheetRow>) => void;
  addRow: (row: Omit<TimesheetRow, 'id'>) => void;
  removeRow: (index: number) => void;
  moveRow: (fromIndex: number, toIndex: number) => void;
  recalculateAll: () => TimesheetRow[];
}

/**
 * Hook for calculating timesheet rows with cascading time calculations
 * @param initialRows Initial timesheet rows
 * @returns Calculator functions and updated rows with dirty state tracking
 */
export const useTimesheetCalculator = (initialRows: TimesheetRow[]): TimesheetCalculatorResult => {
  const [rows, setRows] = useState<TimesheetRow[]>(initialRows);
  const [isDirty, setIsDirty] = useState(false);

  // Track initial rows for dirty comparison
  const initialRowsRef = useRef<TimesheetRow[]>(initialRows);

  // Check if rows are different from initial (for dirty state)
  const isRowsDifferent = useCallback(() => {
    if (initialRowsRef.current.length !== rows.length) {
      return true;
    }
    return rows.some((row, index) => {
      const initialRow = initialRowsRef.current[index];
      return (
        row.taskId !== initialRow?.taskId ||
        row.startTime !== initialRow?.startTime ||
        row.endTime !== initialRow?.endTime ||
        row.duration !== initialRow?.duration ||
        row.description !== initialRow?.description
      );
    });
  }, [rows]);

  // Update dirty state when rows change
  useEffect(() => {
    if (!isDirty) {
      setIsDirty(isRowsDifferent());
    }
  }, [rows, isDirty, isRowsDifferent]);

  // Sync initialRows when server data arrives, but only if not dirty
  // This ensures user changes are not overwritten when server data arrives
  useEffect(() => {
    if (!isDirty && initialRows.length > 0 && initialRowsRef.current.length === 0) {
      // Only sync when server sends actual data and we have no local rows yet
      setRows(initialRows);
      initialRowsRef.current = initialRows;
    }
  }, [initialRows, isDirty]);

  // Convert time string (HH:mm) to minutes from midnight with validation
  const timeToMinutes = useCallback((time: string): number => {
    // Validate input
    if (!time || typeof time !== 'string') {
      return 0;
    }

    const parts = time.split(':');
    if (parts.length !== 2) {
      return 0;
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    // Validate parsed values
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return 0;
    }

    return hours * 60 + minutes;
  }, []);

  // Convert minutes from midnight to time string (HH:mm) with validation
  const minutesToTime = useCallback((minutes: number): string => {
    // Validate input
    if (isNaN(minutes) || minutes < 0) {
      return '00:00';
    }

    // Handle overflow
    const normalizedMinutes = minutes % (24 * 60);
    const hours = Math.floor(normalizedMinutes / 60);
    const mins = normalizedMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }, []);

  // Recalculate all rows from a given index
  const recalculateFromIndex = useCallback((rowsToUpdate: TimesheetRow[], startIndex: number): TimesheetRow[] => {
    const newRows = [...rowsToUpdate];

    for (let i = startIndex; i < newRows.length; i++) {
      if (i === 0) {
        // First row: keep start time, recalculate end time
        const startTimeMinutes = timeToMinutes(newRows[i].startTime);
        const endTimeMinutes = startTimeMinutes + newRows[i].duration;
        newRows[i] = {
          ...newRows[i],
          endTime: minutesToTime(endTimeMinutes)
        };
      } else {
        // Subsequent rows: start time = previous row's end time
        const previousRow = newRows[i - 1];
        const startTime = previousRow.endTime;
        const startTimeMinutes = timeToMinutes(startTime);
        const endTimeMinutes = startTimeMinutes + newRows[i].duration;
        newRows[i] = {
          ...newRows[i],
          startTime,
          endTime: minutesToTime(endTimeMinutes)
        };
      }
    }

    return newRows;
  }, [timeToMinutes, minutesToTime]);

  // Update a specific row and recalculate all subsequent rows
  const updateRow = useCallback((index: number, updatedRow: Partial<TimesheetRow>) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[index] = { ...newRows[index], ...updatedRow } as TimesheetRow;

      // Always recalculate from the updated index
      return recalculateFromIndex(newRows, index);
    });
  }, [recalculateFromIndex]);

  // Add a new row
  const addRow = useCallback((row: Omit<TimesheetRow, 'id'>) => {
    setRows(prevRows => {
      const newRows = [...prevRows, { ...row, id: `row_${Date.now()}` } as TimesheetRow];

      // Recalculate from the added row index
      const addedIndex = newRows.length - 1;
      return recalculateFromIndex(newRows, addedIndex);
    });
  }, [recalculateFromIndex]);

  // Remove a row and recalculate
  const removeRow = useCallback((index: number) => {
    setRows(prevRows => {
      const newRows = prevRows.filter((_, i) => i !== index);

      // Special case: if we removed the first row and there are remaining rows,
      // the new first row should keep the original first row's start time
      if (index === 0 && newRows.length > 0 && prevRows.length > 0) {
        newRows[0] = {
          ...newRows[0],
          startTime: prevRows[0].startTime
        };
      }

      // Recalculate from index 0 to ensure proper cascading
      return recalculateFromIndex(newRows, 0);
    });
  }, [recalculateFromIndex]);

  // Move a row and recalculate
  const moveRow = useCallback((fromIndex: number, toIndex: number) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      const [movedRow] = newRows.splice(fromIndex, 1);
      newRows.splice(toIndex, 0, movedRow);

      // Recalculate from index 0 to ensure proper cascading
      return recalculateFromIndex(newRows, 0);
    });
  }, [recalculateFromIndex]);

  // Recalculate all rows
  const recalculateAll = useCallback((): TimesheetRow[] => {
    return recalculateFromIndex(rows, 0);
  }, [rows, recalculateFromIndex]);

  return {
    rows,
    isDirty,
    setIsDirty,
    updateRow,
    addRow,
    removeRow,
    moveRow,
    recalculateAll
  };
};