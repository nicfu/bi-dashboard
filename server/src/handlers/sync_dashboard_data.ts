
import { db } from '../db';
import { dashboardDataTable } from '../db/schema';
import { type DashboardData, type ExternalApiData, externalApiDataSchema } from '../schema';

// Mock external API call - in real implementation this would be an actual API call
const fetchExternalData = async (): Promise<ExternalApiData[]> => {
  // Simulate API response data
  const mockApiResponse = [
    {
      metric: 'Total Revenue',
      value: 125000.50,
      type: 'revenue' as const,
      timestamp: new Date().toISOString(),
      source: 'simpro_api'
    },
    {
      metric: 'Active Jobs',
      value: 42,
      type: 'jobs' as const,
      timestamp: new Date().toISOString(),
      source: 'simpro_api'
    },
    {
      metric: 'Customer Count',
      value: 1250,
      type: 'customers' as const,
      timestamp: new Date().toISOString(),
      source: 'simpro_api'
    },
    {
      metric: 'System Performance',
      value: 98.5,
      type: 'performance' as const,
      timestamp: new Date().toISOString(),
      source: 'simpro_api'
    }
  ];

  // Validate the response against schema
  return mockApiResponse.map(item => externalApiDataSchema.parse(item));
};

export const syncDashboardData = async (): Promise<DashboardData[]> => {
  try {
    // Fetch data from external API
    const externalData = await fetchExternalData();

    // Transform and insert data into database
    const insertData = externalData.map(item => ({
      metric_name: item.metric,
      metric_value: item.value.toString(), // Convert number to string for numeric column
      metric_type: item.type,
      date_recorded: new Date(item.timestamp),
      source: item.source || 'external_api'
    }));

    // Insert all records
    const results = await db.insert(dashboardDataTable)
      .values(insertData)
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(record => ({
      ...record,
      metric_value: parseFloat(record.metric_value) // Convert string back to number
    }));
  } catch (error) {
    console.error('Dashboard data sync failed:', error);
    throw error;
  }
};
