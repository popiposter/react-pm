import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Title,
  Paper,
  Table,
  Button,
  Select,
  NumberInput,
  TextInput,
  Group,
  Text,
  Badge,
  Modal,
  Stack,
  ActionIcon
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useNotifications } from '@mantine/notifications';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconTrash, IconGripVertical, IconAlertTriangle } from '@tabler/icons-react';
import { useTasks } from '../hooks/useTasks';
import { useTimesheet } from '../hooks/useTimesheet';
import { useTimesheetCalculator } from '../hooks/useTimesheetCalculator';
import { useSaveTimesheet } from '../hooks/useSaveTimesheet';

// SortableRow component for @dnd-kit
const SortableRow = ({ row, index, groupedTasks, updateRow, removeRow }: {
  row: any;
  index: number;
  groupedTasks: Record<string, { value: string; label: string }[]>;
  updateRow: (index: number, row: Partial<any>) => void;
  removeRow: (index: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Table.Tr ref={setNodeRef} style={style}>
      <Table.Td {...attributes} {...listeners} style={{ cursor: 'grab', textAlign: 'center' }}>
        <IconGripVertical size={16} />
      </Table.Td>
      <Table.Td>
        <Select
          placeholder="Выберите задачу"
          data={Object.entries(groupedTasks).map(([group, items]) => ({
            group,
            items
          }))}
          value={row.taskId}
          onChange={(value) => updateRow(index, { taskId: value || '' })}
          searchable
        />
      </Table.Td>
      <Table.Td>
        <TimeInput
          value={row.startTime}
          onChange={(value) => updateRow(index, { startTime: value || '00:00' })}
        />
      </Table.Td>
      <Table.Td>
        <TimeInput
          value={row.endTime}
          readOnly
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          value={row.duration}
          onChange={(value) => updateRow(index, { duration: Number(value) || 0 })}
          min={0}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          value={row.description || ''}
          onChange={(e) => updateRow(index, { description: e.target.value })}
          placeholder="Описание..."
        />
      </Table.Td>
      <Table.Td>
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={() => removeRow(index)}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
};

const TimesheetEditor = () => {
  const { date } = useParams<{ date: string }>();
  const notifications = useNotifications();
  const [conflictModalOpened, { open: openConflictModal, close: closeConflictModal }] = useDisclosure(false);
  const [conflictError, setConflictError] = React.useState<{ message: string } | null>(null);

  // Load data
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: timesheet, isLoading: timesheetLoading } = useTimesheet(date || '');

  // Initialize calculator with timesheet rows or empty array
  const initialRows = timesheet?.rows || [];
  const { rows, updateRow, addRow, removeRow, moveRow } = useTimesheetCalculator(initialRows);

  // Save mutation
  const saveMutation = useSaveTimesheet();

  // Group tasks by project for the Select component
  const groupedTasks = React.useMemo(() => {
    return tasks.reduce((acc, task) => {
      if (!acc[task.projectName]) {
        acc[task.projectName] = [];
      }
      acc[task.projectName].push({ value: task.id, label: task.title });
      return acc;
    }, {} as Record<string, { value: string; label: string }[]>);
  }, [tasks]);

  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1];
    const startTime = lastRow ? lastRow.endTime : '09:00';

    addRow({
      taskId: '',
      date: date || new Date().toISOString().split('T')[0],
      startTime,
      endTime: '10:00',
      duration: 60,
      description: ''
    });
  };

  const handleSave = async () => {
    if (!date || !timesheet) return;

    notifications.show({
      id: 'saving',
      title: 'Сохранение...',
      message: 'Сохраняем табель...',
      loading: true,
      autoClose: false
    });

    try {
      await saveMutation.mutateAsync({
        ...timesheet,
        rows,
        version: timesheet.version
      });

      notifications.update({
        id: 'saving',
        title: 'Сохранено',
        message: navigator.onLine
          ? 'Табель успешно сохранен на сервере'
          : 'Табель сохранен локально (нет сети)',
        color: 'green',
        loading: false,
        autoClose: 3000
      });
    } catch (error: any) {
      if (error.status === 409) {
        setConflictError(error);
        openConflictModal();
        notifications.update({
          id: 'saving',
          title: 'Конфликт версий',
          message: 'Обнаружен более новая версия табеля на сервере',
          color: 'orange',
          loading: false,
          autoClose: 5000
        });
      } else {
        notifications.update({
          id: 'saving',
          title: 'Ошибка сохранения',
          message: 'Не удалось сохранить табель',
          color: 'red',
          loading: false,
          autoClose: 5000
        });
      }
    }
  };

  const handleOverwriteServer = async () => {
    if (!date || !timesheet) return;

    try {
      // Force save with incremented version
      await saveMutation.mutateAsync({
        ...timesheet,
        rows,
        version: timesheet.version + 1
      });

      closeConflictModal();
      notifications.show({
        title: 'Перезаписано',
        message: 'Локальная версия перезаписана на сервере',
        color: 'green',
        autoClose: 3000
      });
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось перезаписать табель',
        color: 'red',
        autoClose: 3000
      });
    }
  };

  const handleUpdateFromServer = async () => {
    // In a real app, we would fetch the latest version from server
    // For mock, we'll just close the modal
    closeConflictModal();
    notifications.show({
      title: 'Обновлено',
      message: 'Данные обновлены с сервера',
      color: 'blue',
      autoClose: 3000
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIndex = rows.findIndex((row: any) => row.id === active.id);
    const overIndex = rows.findIndex((row: any) => row.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      moveRow(activeIndex, overIndex);
    }
  };

  if (tasksLoading || timesheetLoading) {
    return <Container>Загрузка...</Container>;
  }

  return (
    <Container size="lg">
      <Paper shadow="sm" p="md" mb="lg">
        <Group justify="space-between" mb="md">
          <Title order={2}>
            Табель за {date}
            <Badge ml="sm" color={navigator.onLine ? 'green' : 'yellow'}>
              {navigator.onLine ? 'Онлайн' : 'Офлайн'}
            </Badge>
          </Title>
          <Group>
            <Button onClick={handleAddRow}>Добавить строку</Button>
            <Button onClick={handleSave} loading={saveMutation.isPending}>
              Сохранить
            </Button>
          </Group>
        </Group>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={rows.map((row: any) => row.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '40px' }}></Table.Th>
                  <Table.Th>Задача</Table.Th>
                  <Table.Th style={{ width: '120px' }}>Начало</Table.Th>
                  <Table.Th style={{ width: '120px' }}>Окончание</Table.Th>
                  <Table.Th style={{ width: '120px' }}>Длительность (мин)</Table.Th>
                  <Table.Th>Описание</Table.Th>
                  <Table.Th style={{ width: '60px' }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row: any, index: number) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    index={index}
                    groupedTasks={groupedTasks}
                    updateRow={updateRow}
                    removeRow={removeRow}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </SortableContext>
        </DndContext>

        {rows.length === 0 && (
          <Text ta="center" c="dimmed" py="xl">
            Нет записей. Нажмите "Добавить строку" чтобы начать.
          </Text>
        )}
      </Paper>

      <Modal
        opened={conflictModalOpened}
        onClose={closeConflictModal}
        title={
          <Group>
            <IconAlertTriangle color="orange" />
            <Text>Конфликт версий</Text>
          </Group>
        }
        size="md"
      >
        <Stack>
          <Text>
            {conflictError?.message || 'Обнаружена более новая версия табеля на сервере.'}
          </Text>
          <Text>
            Ваши локальные изменения могут быть потеряны при обновлении.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleUpdateFromServer}>
              Обновить с сервера
            </Button>
            <Button color="red" onClick={handleOverwriteServer}>
              Перезаписать сервер
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default TimesheetEditor;
