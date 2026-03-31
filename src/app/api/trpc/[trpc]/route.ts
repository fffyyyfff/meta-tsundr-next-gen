import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { authService } from '@/server/middleware/auth';
import type { Context } from '@/server/trpc';

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}

async function createContext(req: Request): Promise<Context> {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const token = parseCookie(cookieHeader, 'auth_token');

  if (!token) return { userId: null };

  const payload = await authService.verifyToken(token);
  return { userId: payload?.sub ?? null };
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
  });

export { handler as GET, handler as POST };
