
import { db } from '../db';
import { dashboardDataTable } from '../db/schema';
import { type CreateDashboardDataInput, type DashboardData } from '../schema';

export const createDashboardData = async (input: CreateDashboardDataInput): Promise<DashboardData> => {
  try {
    // Insert dashboard data record
    const result = await db.insert(dashboardDataTable)
      .values({
        metric_name: input.metric_name,
        metric_value: input.metric_value.toString(), // Convert number to string for numeric column
        metric_type: input.metric_type,
        date_recorded: input.date_recorded || new Date(), // Use provided date or default to now
        source: input.source
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const dashboardData = result[0];
    return {
      ...dashboardData,
      metric_value: parseFloat(dashboardData.metric_value) // Convert string back to number
    };
  } catch (error) {
    console.error('Dashboard data creation failed:', error);
    throw error;
  }
};
