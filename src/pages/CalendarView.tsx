import React, { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Schedule, ScheduleProps } from '@mantine/schedule';
import { Container, Title, Text, Badge, Grid, Box, Paper } from '@mantine/core';
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

  // Adjust for Monday-first week (0=Sunday, 1=Monday, etc.)
  // Convert Sunday (0) to 7 to make it the end of the week
  const firstDayAdjusted = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
  const emptySlotsCount = firstDayAdjusted - 1;

  // Create array of days with empty slots for start of week
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: emptySlotsCount }, (_, i) => i);

  return (
    <Box>
      {/* Weekday headers */}
      <Grid gutter="xs">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <Grid.Col span={1.7} key={day}>
            <Paper p={4} ta="center" fw={700} bg="gray.1">
              {day}
            </Paper>
          </Grid.Col>
        ))}
      </Grid>

      {/* Calendar grid */}
      <Grid gutter="xs">
        {/* Empty slots at the beginning of the month */}
        {emptySlots.map((_, index) => (
          <Grid.Col span={1.7} key={`empty-${index}`}>
            <Paper p="sm" h={80} />
          </Grid.Col>
        ))}

        {/* Days of the month */}
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTimesheet = timesheets.find(ts => ts.date === dateStr);

          return (
            <Grid.Col span={1.7} key={day}>
              <Paper
                p="xs"
                h={80}
                onClick={() => onDayClick(new Date(year, month, day))}
                style={{ cursor: 'pointer' }}
                bg={dayTimesheet ? 'blue.0' : 'white'}
                bd="1px solid #eee"
              >
                <Text fw={700}>{day}</Text>
                {dayTimesheet && (
                  <Box mt="xs">
                    <Text size="xs">{Math.round(dayTimesheet.rows.reduce((sum, row) => sum + row.duration, 0) / 60)}ч</Text>
                    {dayTimesheet.rows.slice(0, 1).map(row => {
                      return (
                        <Badge key={row.id} size="xs" variant="dot">
                          {row.description || 'Без описания'}
                        </Badge>
                      );
                    })}
                  </Box>
                )}
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>
    </Box>
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