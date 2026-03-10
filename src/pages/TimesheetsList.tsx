import {
  Container,
  Title,
  Paper,
  Table,
  Button,
  Group,
  Text,
  Badge,
  Stack,
  Card,
  SimpleGrid,
  ActionIcon,
  ScrollArea,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTimesheets } from '../hooks/useTimesheets';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlus, IconClock, IconEdit } from '@tabler/icons-react';

// Get timesheet total hours
const getTotalHours = (rows: any[]): number => {
  const totalMinutes = rows.reduce((sum, row) => sum + row.duration, 0);
  return Math.round(totalMinutes / 60 * 10) / 10;
};

// Get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'submitted':
      return 'blue';
    case 'approved':
      return 'green';
    default:
      return 'gray';
  }
};

// Desktop view: Table
const TimesheetsTable = ({ timesheets, onEdit }: { timesheets: any[]; onEdit: (date: string) => void }) => {
  return (
    <ScrollArea type="auto">
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Дата</Table.Th>
            <Table.Th>Статус</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Длительность</Table.Th>
            <Table.Th style={{ width: '80px' }}></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {timesheets.map((timesheet) => (
            <Table.Tr key={timesheet.id}>
              <Table.Td>
                <Text size="sm">
                  {new Date(timesheet.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge color={getStatusColor(timesheet.status)}>
                  {timesheet.status === 'draft' ? 'Черновик' : timesheet.status === 'submitted' ? 'Отправлен' : 'Утвержден'}
                </Badge>
              </Table.Td>
              <Table.Td style={{ textAlign: 'right' }}>
                <Text size="sm" fw={500}>
                  {getTotalHours(timesheet.rows)} ч.
                </Text>
              </Table.Td>
              <Table.Td>
                <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(timesheet.date)}>
                  <IconEdit size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
          {timesheets.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text ta="center" c="dimmed">
                  Нет табелей за этот период
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
};

// Mobile view: Card list
const TimesheetsCards = ({ timesheets, onEdit }: { timesheets: any[]; onEdit: (date: string) => void }) => {
  return (
    <SimpleGrid cols={1} spacing="md">
      {timesheets.map((timesheet) => (
        <Card key={timesheet.id} withBorder shadow="xs" padding="md" radius="md">
          <Group justify="space-between">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group justify="space-between">
                <Text fw={500}>
                  {new Date(timesheet.date).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Badge color={getStatusColor(timesheet.status)} size="sm">
                  {timesheet.status === 'draft' ? 'Черновик' : timesheet.status === 'submitted' ? 'Отправлен' : 'Утвержден'}
                </Badge>
              </Group>
              <Group gap="md" mt="xs">
                <Text size="sm" c="dimmed">
                  <IconClock size={14} style={{ display: 'inline', marginRight: 4 }} />
                  {getTotalHours(timesheet.rows)} ч.
                </Text>
              </Group>
            </Stack>
            <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(timesheet.date)}>
              <IconEdit size={20} />
            </ActionIcon>
          </Group>
        </Card>
      ))}
      {timesheets.length === 0 && (
        <Paper p="xl" withBorder>
          <Text ta="center" c="dimmed">
            Нет табелей за этот период
          </Text>
        </Paper>
      )}
    </SimpleGrid>
  );
};

const TimesheetsList = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Get current month for default timesheets query
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const { data: timesheets = [], isLoading } = useTimesheets(getCurrentMonth());

  const handleCreateTimesheet = () => {
    const today = new Date().toISOString().split('T')[0];
    navigate(`/timesheet/${today}`);
  };

  const handleEdit = (date: string) => {
    navigate(`/timesheet/${date}`);
  };

  if (isLoading) {
    return <Container>Загрузка...</Container>;
  }

  return (
    <Container size="lg">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Журнал табелей</Title>
        <Button onClick={handleCreateTimesheet} leftSection={<IconPlus size={18} />}>
          Создать табель
        </Button>
      </Group>

      {isMobile ? (
        <TimesheetsCards timesheets={timesheets} onEdit={handleEdit} />
      ) : (
        <TimesheetsTable timesheets={timesheets} onEdit={handleEdit} />
      )}
    </Container>
  );
};

export default TimesheetsList;
