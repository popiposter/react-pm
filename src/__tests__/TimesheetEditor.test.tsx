import { describe, it, expect, vi } from 'vitest';

// Create the Table mock with sub-components - must use named functions
function TableTr(props: any) { return <tr {...props}>{props.children}</tr>; }
function TableTd(props: any) { return <td {...props}>{props.children}</td>; }
function TableTh(props: any) { return <th {...props}>{props.children}</th>; }
function TableThead(props: any) { return <thead {...props}>{props.children}</thead>; }
function TableTbody(props: any) { return <tbody {...props}>{props.children}</tbody>; }
function TableScrollContainer(props: any) { return <div {...props}>{props.children}</div>; }

function TableMock(props: any) { return <table {...props}>{props.children}</table>; }
TableMock.Tr = TableTr;
TableMock.Td = TableTd;
TableMock.Th = TableTh;
TableMock.Thead = TableThead;
TableMock.Tbody = TableTbody;
TableMock.ScrollContainer = TableScrollContainer;

vi.mock('@mantine/core', async (importOriginal: any) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Container: (props: any) => <div {...props}>{props.children}</div>,
    Title: (props: any) => <h2 {...props}>{props.children}</h2>,
    Paper: (props: any) => <div {...props}>{props.children}</div>,
    Table: TableMock,
    Button: ({ children, leftSection, ...props }: any) => {
      const content = leftSection ? <>{leftSection}<span>{children}</span></> : children;
      return <button {...props}>{content}</button>;
    },
    Select: (props: any) => <select {...props}>{props.children}</select>,
    NumberInput: (props: any) => <input {...props} type="number" />,
    Group: (props: any) => <div {...props}>{props.children}</div>,
    Text: (props: any) => <span {...props}>{props.children}</span>,
    Badge: (props: any) => <span {...props}>{props.children}</span>,
    Modal: (props: any) => <div {...props}>{props.children}</div>,
    Stack: (props: any) => <div {...props}>{props.children}</div>,
    ActionIcon: (props: any) => <button {...props}>{props.children}</button>,
    ScrollArea: (props: any) => <div {...props}>{props.children}</div>,
    Input: (props: any) => <input {...props} />,
    Textarea: (props: any) => <textarea {...props} />,
    Loader: (props: any) => <div {...props}>Loading...</div>,
    MantineProvider: (props: any) => <div {...props}>{props.children}</div>,
  };
});

// Mock @mantine/dates (TimeInput component)
vi.mock('@mantine/dates', () => ({
  TimeInput: (props: any) => <input {...props} type="time" />,
}));

// Mock @mantine/notifications
vi.mock('@mantine/notifications', () => ({
  useNotifications: () => ({
    show: vi.fn(),
    update: vi.fn(),
  }),
}));

// Mock @mantine/hooks
vi.mock('@mantine/hooks', () => ({
  useDisclosure: () => [false, { open: vi.fn(), close: vi.fn() }],
  useMediaQuery: () => false, // Default to desktop view
}));

// Mock @dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: (props: any) => <div {...props}>{props.children}</div>,
  closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: (props: any) => <div {...props}>{props.children}</div>,
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

// Mock @tabler/icons-react
vi.mock('@tabler/icons-react', () => ({
  IconTrash: () => <svg data-icon="trash" />,
  IconGripVertical: () => <svg data-icon="grip" />,
  IconAlertTriangle: () => <svg data-icon="alert" />,
  IconPlus: () => <svg data-icon="plus" />,
  IconDiskette: () => <svg data-icon="diskette" />,
}));

// Mock custom hooks
vi.mock('../hooks/useTasks', () => ({
  useTasks: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useTimesheet', () => ({
  useTimesheet: () => ({
    data: {
      id: 'ts_2023-01-01',
      date: '2023-01-01',
      userId: 'user1',
      version: 1,
      rows: [],
      status: 'draft'
    },
    isLoading: false,
  }),
}));

vi.mock('../hooks/useTimesheetCalculator', () => ({
  useTimesheetCalculator: () => ({
    rows: [],
    updateRow: vi.fn(),
    addRow: vi.fn(),
    removeRow: vi.fn(),
    moveRow: vi.fn(),
    recalculateAll: vi.fn(),
  }),
}));

vi.mock('../hooks/useSaveTimesheet', () => ({
  useSaveTimesheet: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useParams: () => ({ date: '2023-01-01' }),
    useNavigate: () => vi.fn(),
  };
});

// Now import the test utilities and component AFTER all mocks are set up
import { render as rtlRender, screen } from '@testing-library/react';
import TimesheetEditor from '../pages/TimesheetEditor';
import { MantineProvider } from '@mantine/core';

// Custom render function with MantineProvider
const customRender = (ui: React.ReactElement) => {
  return rtlRender(<MantineProvider>{ui}</MantineProvider>);
};

describe('TimesheetEditor Component', () => {
  it('should render timesheet title', () => {
    customRender(<TimesheetEditor />);
    expect(screen.getByText(/Табель за 2023-01-01/i)).toBeInTheDocument();
  });

  it('should render add row button', () => {
    customRender(<TimesheetEditor />);
    expect(screen.getByText('Добавить строку')).toBeInTheDocument();
  });

  it('should render save button', () => {
    customRender(<TimesheetEditor />);
    expect(screen.getByText('Сохранить')).toBeInTheDocument();
  });

  it('should show online indicator', () => {
    customRender(<TimesheetEditor />);
    // The online status is part of the title, not a standalone badge
    expect(screen.getByText(/Онлайн/i)).toBeInTheDocument();
  });
});
