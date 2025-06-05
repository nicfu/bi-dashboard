
import { type ExternalApiData } from '../schema';

export const fetchExternalData = async (): Promise<ExternalApiData[]> => {
  try {
    // Simulate external API call with realistic business metrics data
    // In a real implementation, this would be an actual HTTP request to Simpro or similar
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    
    const mockApiResponse: ExternalApiData[] = [
      {
        metric: 'Total Revenue',
        value: 125000.50,
        type: 'revenue',
        timestamp: new Date().toISOString(),
        source: 'simpro_api'
      },
      {
        metric: 'Completed Jobs',
        value: 45,
        type: 'jobs',
        timestamp: new Date().toISOString(),
        source: 'simpro_api'
      },
      {
        metric: 'Active Customers',
        value: 238,
        type: 'customers',
        timestamp: new Date().toISOString(),
        source: 'simpro_api'
      },
      {
        metric: 'System Performance Score',
        value: 92.5,
        type: 'performance',
        timestamp: new Date().toISOString(),
        source: 'simpro_api'
      },
      {
        metric: 'Monthly Revenue',
        value: 45000.75,
        type: 'revenue',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        source: 'simpro_api'
      }
    ];

    return mockApiResponse;
  } catch (error) {
    console.error('External API fetch failed:', error);
    throw error;
  }
};
