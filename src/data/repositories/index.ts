import { localAppRepository } from './localAppRepository';
import type { AppRepository } from './types';

export const appRepository: AppRepository = localAppRepository;

export type * from './types';
