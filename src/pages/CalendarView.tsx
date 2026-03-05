import React, { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Schedule, ScheduleProps } from '@mantine/schedule';
import { Container, Title, Text, Badge } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTimesheets } from '../hooks/useTimesheets';

// Simple mobile month view component
const MobileMonthView = ({
  year,
  month,
  onDayClick
}: {
  year: number;
  month: number;
  onDayClick: (date: Date) => void;
}) => {
  const { data: timesheets = [] } = useTimesheets(`${year}-${String(month + 1).padStart(2, '0')}`);

  // Generate days for the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Create array of days with empty slots for start of week
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
        <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: '8px 0' }}>
          {day}
        </div>
      ))}

      {emptySlots.map(slot => (
        <div key={`empty-${slot}`} style={{ height: '60px' }} />
      ))}

      {days.map(day => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTimesheet = timesheets.find(ts => ts.date === dateStr);

        return (
          <div
            key={day}
            onClick={() => onDayClick(new Date(year, month, day))}
            style={{
              height: '60px',
              border: '1px solid #eee',
              padding: '4px',
              cursor: 'pointer',
              backgroundColor: dayTimesheet ? '#e3f2fd' : 'white'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{day}</div>
            {dayTimesheet && (
              <div>
                <Text size="xs">{Math.round(dayTimesheet.rows.reduce((sum, row) => sum + row.duration, 0) / 60)}ч</Text>
                {dayTimesheet.rows.slice(0, 1).map(row => {
                  const task = dayTimesheet.rows.find(r => r.taskId === row.taskId);
                  return task ? (
                    <Badge key={row.id} size="xs" variant="dot">
                      {task.projectName}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CalendarView = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get timesheets for current month
  const { data: timesheets = [] } = useTimesheets(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    navigate(`/timesheet/${dateStr}`);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const events: ScheduleProps['events'] = timesheets.map(timesheet => ({
    date: new Date(timesheet.date),
    children: (
      <div>
        <Text size="sm" fw={500}>
          {Math.round(timesheet.rows.reduce((sum, row) => sum + row.duration, 0) / 60)} часов
        </Text>
        {timesheet.rows.slice(0, 2).map(row => (
          <Text key={row.id} size="xs" c="dimmed">
            {row.description || 'Без описания'}
          </Text>
        ))}
      </div>
    ),
  }));

  return (
    <Container size="lg">
      <Title order={2} mb="xl">Календарь расписания</Title>

      {isMobile ? (
        <MobileMonthView
          year={currentDate.getFullYear()}
          month={currentDate.getMonth()}
          onDayClick={handleDateClick}
        />
      ) : (
        <Schedule
          events={events}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onNext={handleNextMonth}
          onPrevious={handlePreviousMonth}
          locale="ru"
        />
      )}
    </Container>
  );
};

export default CalendarView;