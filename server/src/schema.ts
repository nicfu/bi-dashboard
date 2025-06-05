
import { z } from 'zod';

// Dashboard data schema
export const dashboardDataSchema = z.object({
  id: z.number(),
  metric_name: z.string(),
  metric_value: z.number(),
  metric_type: z.enum(['revenue', 'jobs', 'customers', 'performance']),
  date_recorded: z.coerce.date(),
  source: z.string(),
  created_at: z.coerce.date()
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;

// External API data schema (for Simpro-like responses)
export const externalApiDataSchema = z.object({
  metric: z.string(),
  value: z.number(),
  type: z.enum(['revenue', 'jobs', 'customers', 'performance']),
  timestamp: z.string(),
  source: z.string().optional().default('external_api')
});

export type ExternalApiData = z.infer<typeof externalApiDataSchema>;

// Input schema for creating dashboard data
export const createDashboardDataInputSchema = z.object({
  metric_name: z.string(),
  metric_value: z.number(),
  metric_type: z.enum(['revenue', 'jobs', 'customers', 'performance']),
  date_recorded: z.coerce.date().optional(),
  source: z.string().default('manual')
});

export type CreateDashboardDataInput = z.infer<typeof createDashboardDataInputSchema>;

// Filter schema for dashboard queries
export const dashboardFilterSchema = z.object({
  metric_type: z.enum(['revenue', 'jobs', 'customers', 'performance']).optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  source: z.string().optional(),
  limit: z.number().int().positive().max(1000).default(100)
});

export type DashboardFilter = z.infer<typeof dashboardFilterSchema>;

// Dashboard summary schema
export const dashboardSummarySchema = z.object({
  total_metrics: z.number(),
  latest_update: z.coerce.date(),
  metrics_by_type: z.record(z.enum(['revenue', 'jobs', 'customers', 'performance']), z.number()),
  sources: z.array(z.string())
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
