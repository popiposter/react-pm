import { useQuery } from '@tanstack/react-query';
import { getTasks, Task } from '../api/mockBackend';

export const useTasks = () => {
  return useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: getTasks,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};