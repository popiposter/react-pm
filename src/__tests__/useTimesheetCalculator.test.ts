import { renderHook, act } from '@testing-library/react';
import { useTimesheetCalculator } from '../hooks/useTimesheetCalculator';

describe('useTimesheetCalculator', () => {
  const initialRows = [
    {
      id: '1',
      taskId: 'task1',
      date: '2023-01-01',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      description: 'Task 1'
    },
    {
      id: '2',
      taskId: 'task2',
      date: '2023-01-01',
      startTime: '10:00',
      endTime: '11:00',
      duration: 60,
      description: 'Task 2'
    }
  ];

  it('should initialize with provided rows', () => {
    const { result } = renderHook(() => useTimesheetCalculator(initialRows));

    expect(result.current.rows).toEqual(initialRows);
  });

  it('should update a row duration and recalculate subsequent rows', () => {
    const { result } = renderHook(() => useTimesheetCalculator(initialRows));

    act(() => {
      result.current.updateRow(0, { duration: 90 }); // Change first row to 90 minutes
    });

    // First row should have updated end time (09:00 + 90min = 10:30)
    expect(result.current.rows[0].startTime).toBe('09:00');
    expect(result.current.rows[0].endTime).toBe('10:30');

    // Second row should start at 10:30 and end at 11:30
    expect(result.current.rows[1].startTime).toBe('10:30');
    expect(result.current.rows[1].endTime).toBe('11:30');
  });

  it('should add a new row and recalculate', () => {
    const { result } = renderHook(() => useTimesheetCalculator(initialRows));

    act(() => {
      result.current.addRow({
        taskId: 'task3',
        date: '2023-01-01',
        startTime: '11:00',
        endTime: '12:00',
        duration: 60,
        description: 'Task 3'
      });
    });

    expect(result.current.rows).toHaveLength(3);
    // The third row should be properly calculated
    expect(result.current.rows[2].startTime).toBe('11:00');
  });

  it('should remove a row and recalculate', () => {
    const { result } = renderHook(() => useTimesheetCalculator(initialRows));

    act(() => {
      result.current.removeRow(0);
    });

    expect(result.current.rows).toHaveLength(1);
    // Remaining row should now start at original first row's start time
    expect(result.current.rows[0].startTime).toBe('09:00');
  });
});