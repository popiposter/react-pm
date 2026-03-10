import { useQuery } from '@tanstack/react-query';
import { Task } from '../api/mockBackend';
import { appRepository } from '../data/repositories';

export const useTasks = () => {
  return useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: () => appRepository.tasks.getTasks(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
