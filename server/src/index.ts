
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createDashboardDataInputSchema, 
  dashboardFilterSchema 
} from './schema';
import { fetchExternalData } from './handlers/fetch_external_data';
import { syncDashboardData } from './handlers/sync_dashboard_data';
import { getDashboardData } from './handlers/get_dashboard_data';
import { getDashboardSummary } from './handlers/get_dashboard_summary';
import { createDashboardData } from './handlers/create_dashboard_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Fetch data from external API (like Simpro)
  fetchExternalData: publicProcedure
    .query(() => fetchExternalData()),
  
  // Sync external data to local database
  syncDashboardData: publicProcedure
    .mutation(() => syncDashboardData()),
  
  // Get dashboard data with optional filtering
  getDashboardData: publicProcedure
    .input(dashboardFilterSchema.optional())
    .query(({ input }) => getDashboardData(input)),
  
  // Get dashboard summary statistics
  getDashboardSummary: publicProcedure
    .query(() => getDashboardSummary()),
  
  // Create dashboard data manually
  createDashboardData: publicProcedure
    .input(createDashboardDataInputSchema)
    .mutation(({ input }) => createDashboardData(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Dashboard TRPC server listening at port: ${port}`);
}

start();
