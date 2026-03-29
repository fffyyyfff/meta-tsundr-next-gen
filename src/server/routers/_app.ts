import { router } from '../trpc';
import { agentRouter } from './agent';
import { figmaRouter } from './figma';
import { linearRouter } from './linear';

export const appRouter = router({
  agent: agentRouter,
  figma: figmaRouter,
  linear: linearRouter,
});

export type AppRouter = typeof appRouter;
