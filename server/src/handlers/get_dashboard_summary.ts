
import { db } from '../db';
import { dashboardDataTable } from '../db/schema';
import { type DashboardSummary } from '../schema';
import { count, max, sql } from 'drizzle-orm';

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    // Get total metrics count
    const totalResult = await db.select({ count: count() })
      .from(dashboardDataTable)
      .execute();

    // Get latest update timestamp
    const latestResult = await db.select({ latest: max(dashboardDataTable.created_at) })
      .from(dashboardDataTable)
      .execute();

    // Get metrics count by type
    const metricsByTypeResult = await db.select({
      metric_type: dashboardDataTable.metric_type,
      count: count()
    })
      .from(dashboardDataTable)
      .groupBy(dashboardDataTable.metric_type)
      .execute();

    // Get unique sources
    const sourcesResult = await db.select({
      source: dashboardDataTable.source
    })
      .from(dashboardDataTable)
      .groupBy(dashboardDataTable.source)
      .execute();

    // Build metrics_by_type record
    const metricsByType: Record<string, number> = {};
    metricsByTypeResult.forEach(row => {
      metricsByType[row.metric_type] = row.count;
    });

    // Extract unique sources
    const sources = sourcesResult.map(row => row.source);

    return {
      total_metrics: totalResult[0]?.count || 0,
      latest_update: latestResult[0]?.latest || new Date(),
      metrics_by_type: metricsByType as Record<'revenue' | 'jobs' | 'customers' | 'performance', number>,
      sources: sources
    };
  } catch (error) {
    console.error('Dashboard summary retrieval failed:', error);
    throw error;
  }
};
