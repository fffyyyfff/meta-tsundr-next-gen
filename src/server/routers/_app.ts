import { router } from '../trpc';
import { agentRouter } from './agent';
import { figmaRouter } from './figma';
import { linearRouter } from './linear';
import { historyRouter } from './history';
import { usageRouter } from './usage';
import { exportRouter } from './export';
import { notificationRouter } from './notification';

export const appRouter = router({
  agent: agentRouter,
  figma: figmaRouter,
  linear: linearRouter,
  history: historyRouter,
  usage: usageRouter,
  export: exportRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
