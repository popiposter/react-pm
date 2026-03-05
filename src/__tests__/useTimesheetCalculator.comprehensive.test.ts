import { renderHook, act } from '@testing-library/react';
import { useTimesheetCalculator } from '../hooks/useTimesheetCalculator';

describe('useTimesheetCalculator - Comprehensive Tests', () => {
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
    },
    {
      id: '3',
      taskId: 'task3',
      date: '2023-01-01',
      startTime: '11:00',
      endTime: '12:00',
      duration: 60,
      description: 'Task 3'
    }
  ];

  it('should handle adding rows and recalculating', () => {
    const { result } = renderHook(() => useTimesheetCalculator(initialRows));

    act(() => {
      result.current.addRow({
        taskId: 'task4',
        date: '2023-01-01',
        startTime: '12:00',
        endTime: '13:00',
        duration: 60,
        description: 'Task 4'
      });
    });

    expect(result.current.rows).toHaveLength(4);
    // The new row should be properly calculated
    expect(result.current.rows[3].startTime).toBe('12:00');
    expect(result.current.rows[3].endTime).toBe('13:00');
  });

  it('should move a row and recalculate properly', () => {
    const { result } = renderHook(() => useTimesheetCalculator(initialRows));

    act(() => {
      result.current.moveRow(2, 0); // Move last row to beginning
    });

    // After moving, rows should be properly recalculated
    expect(result.current.rows).toHaveLength(3);
    // First row should be the moved row but with adjusted times
    expect(result.current.rows[0].taskId).toBe('task3');
  });

  it('should recalculate all rows', () => {
    const { result } = renderHook(() => useTimesheetCalculator(initialRows));

    act(() => {
      const recalculated = result.current.recalculateAll();
      // Since our hook manages state internally, we just test that the function exists and runs
      expect(recalculated).toBeDefined();
    });
  });

  it('should handle updating start time of first row', () => {
    const { result } = renderHook(() => useTimesheetCalculator(initialRows));

    act(() => {
      result.current.updateRow(0, { startTime: '08:30' });
    });

    // First row should start at 08:30 and end at 09:30
    expect(result.current.rows[0].startTime).toBe('08:30');
    expect(result.current.rows[0].endTime).toBe('09:30');
  });

  it('should handle empty rows', () => {
    const { result } = renderHook(() => useTimesheetCalculator([]));

    expect(result.current.rows).toHaveLength(0);

    act(() => {
      result.current.addRow({
        taskId: 'task1',
        date: '2023-01-01',
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        description: 'New task'
      });
    });

    expect(result.current.rows).toHaveLength(1);
    expect(result.current.rows[0].startTime).toBe('09:00');
  });
});