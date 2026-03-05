import React from 'react';
import { render, screen } from '../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import CalendarView from '../pages/CalendarView';

// Mock react-router-dom hooks with importOriginal
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock @mantine/hooks for useMediaQuery
vi.mock('@mantine/hooks', () => ({
  useMediaQuery: () => false, // Return desktop view for testing
}));

// Mock the useTimesheets hook
vi.mock('../hooks/useTimesheets', () => ({
  useTimesheets: () => ({
    data: [],
    isLoading: false,
  }),
}));

describe('CalendarView Component', () => {
  it('should render calendar title', () => {
    render(<CalendarView />);
    expect(screen.getByText('Календарь расписания')).toBeInTheDocument();
  });
});
