
import { db } from '../db';
import { dashboardDataTable } from '../db/schema';
import { type DashboardData, type DashboardFilter } from '../schema';
import { and, gte, lte, eq, desc, type SQL } from 'drizzle-orm';

export const getDashboardData = async (filter?: DashboardFilter): Promise<DashboardData[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter) {
      if (filter.metric_type) {
        conditions.push(eq(dashboardDataTable.metric_type, filter.metric_type));
      }

      if (filter.date_from) {
        conditions.push(gte(dashboardDataTable.date_recorded, filter.date_from));
      }

      if (filter.date_to) {
        conditions.push(lte(dashboardDataTable.date_recorded, filter.date_to));
      }

      if (filter.source) {
        conditions.push(eq(dashboardDataTable.source, filter.source));
      }
    }

    // Build the complete query in one go to avoid type issues
    const limit = filter?.limit || 100;
    
    const results = conditions.length > 0
      ? await db.select()
          .from(dashboardDataTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(dashboardDataTable.date_recorded))
          .limit(limit)
          .execute()
      : await db.select()
          .from(dashboardDataTable)
          .orderBy(desc(dashboardDataTable.date_recorded))
          .limit(limit)
          .execute();

    // Convert numeric fields back to numbers
    return results.map(result => ({
      ...result,
      metric_value: parseFloat(result.metric_value)
    }));
  } catch (error) {
    console.error('Dashboard data retrieval failed:', error);
    throw error;
  }
};
