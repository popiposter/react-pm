import { createFileRoute } from '@tanstack/react-router';
import { TimesheetEditorSkeleton } from '../../components/pending/TimesheetEditorSkeleton';
import { tasksQueryOptions, timesheetQueryOptions } from '../../data/queryOptions';
import TimesheetEditor from '../../pages/TimesheetEditor';

export const Route = createFileRoute('/_authenticated/timesheet/$date')({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(tasksQueryOptions()),
      context.queryClient.ensureQueryData(timesheetQueryOptions(params.date)),
    ]);
  },
  pendingComponent: TimesheetEditorSkeleton,
  component: TimesheetEditor,
});
