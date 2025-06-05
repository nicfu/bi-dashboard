
import { serial, text, pgTable, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core';

// Define metric type enum
export const metricTypeEnum = pgEnum('metric_type', ['revenue', 'jobs', 'customers', 'performance']);

export const dashboardDataTable = pgTable('dashboard_data', {
  id: serial('id').primaryKey(),
  metric_name: text('metric_name').notNull(),
  metric_value: numeric('metric_value', { precision: 12, scale: 2 }).notNull(),
  metric_type: metricTypeEnum('metric_type').notNull(),
  date_recorded: timestamp('date_recorded').defaultNow().notNull(),
  source: text('source').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type DashboardData = typeof dashboardDataTable.$inferSelect;
export type NewDashboardData = typeof dashboardDataTable.$inferInsert;

// Export all tables for proper query building
export const tables = { dashboardData: dashboardDataTable };
