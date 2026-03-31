import { router } from '../trpc';
import { agentRouter } from './agent';
import { figmaRouter } from './figma';
import { linearRouter } from './linear';
import { historyRouter } from './history';
import { usageRouter } from './usage';

export const appRouter = router({
  agent: agentRouter,
  figma: figmaRouter,
  linear: linearRouter,
  history: historyRouter,
  usage: usageRouter,
});

export type AppRouter = typeof appRouter;
