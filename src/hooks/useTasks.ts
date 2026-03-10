import { useQuery } from '@tanstack/react-query';
import { tasksQueryOptions } from '../data/queryOptions';

export const useTasks = () => {
  return useQuery(tasksQueryOptions());
};
