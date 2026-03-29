import { router } from '../trpc';
import { agentRouter } from './agent';
import { figmaRouter } from './figma';

export const appRouter = router({
  agent: agentRouter,
  figma: figmaRouter,
});

export type AppRouter = typeof appRouter;
