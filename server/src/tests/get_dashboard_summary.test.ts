
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dashboardDataTable } from '../db/schema';
import { type CreateDashboardDataInput } from '../schema';
import { getDashboardSummary } from '../handlers/get_dashboard_summary';

// Test data for dashboard entries
const testData: CreateDashboardDataInput[] = [
  {
    metric_name: 'Monthly Revenue',
    metric_value: 50000,
    metric_type: 'revenue',
    source: 'simpro_api'
  },
  {
    metric_name: 'Active Jobs',
    metric_value: 25,
    metric_type: 'jobs',
    source: 'simpro_api'
  },
  {
    metric_name: 'Customer Count',
    metric_value: 150,
    metric_type: 'customers',
    source: 'manual'
  },
  {
    metric_name: 'System Performance',
    metric_value: 95.5,
    metric_type: 'performance',
    source: 'monitoring'
  }
];

describe('getDashboardSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary when no data exists', async () => {
    const result = await getDashboardSummary();

    expect(result.total_metrics).toEqual(0);
    expect(result.latest_update).toBeInstanceOf(Date);
    expect(result.metrics_by_type).toEqual({});
    expect(result.sources).toEqual([]);
  });

  it('should return correct summary with test data', async () => {
    // Insert test data
    await db.insert(dashboardDataTable)
      .values(testData.map(data => ({
        ...data,
        metric_value: data.metric_value.toString(),
        date_recorded: new Date()
      })))
      .execute();

    const result = await getDashboardSummary();

    expect(result.total_metrics).toEqual(4);
    expect(result.latest_update).toBeInstanceOf(Date);
    expect(result.metrics_by_type).toEqual({
      revenue: 1,
      jobs: 1,
      customers: 1,
      performance: 1
    });
    expect(result.sources).toHaveLength(3);
    expect(result.sources).toContain('simpro_api');
    expect(result.sources).toContain('manual');
    expect(result.sources).toContain('monitoring');
  });

  it('should count multiple metrics of same type correctly', async () => {
    // Insert multiple revenue metrics
    const multipleRevenueData = [
      {
        metric_name: 'Q1 Revenue',
        metric_value: '25000',
        metric_type: 'revenue' as const,
        source: 'simpro_api',
        date_recorded: new Date()
      },
      {
        metric_name: 'Q2 Revenue',
        metric_value: '30000',
        metric_type: 'revenue' as const,
        source: 'simpro_api',
        date_recorded: new Date()
      },
      {
        metric_name: 'Customer Count',
        metric_value: '100',
        metric_type: 'customers' as const,
        source: 'manual',
        date_recorded: new Date()
      }
    ];

    await db.insert(dashboardDataTable)
      .values(multipleRevenueData)
      .execute();

    const result = await getDashboardSummary();

    expect(result.total_metrics).toEqual(3);
    expect(result.metrics_by_type).toEqual({
      revenue: 2,
      customers: 1
    });
    expect(result.sources).toHaveLength(2);
  });

  it('should handle duplicate sources correctly', async () => {
    // Insert data with duplicate sources
    const duplicateSourceData = [
      {
        metric_name: 'Revenue 1',
        metric_value: '1000',
        metric_type: 'revenue' as const,
        source: 'simpro_api',
        date_recorded: new Date()
      },
      {
        metric_name: 'Revenue 2',
        metric_value: '2000',
        metric_type: 'revenue' as const,
        source: 'simpro_api',
        date_recorded: new Date()
      }
    ];

    await db.insert(dashboardDataTable)
      .values(duplicateSourceData)
      .execute();

    const result = await getDashboardSummary();

    expect(result.sources).toHaveLength(1);
    expect(result.sources).toContain('simpro_api');
  });
});
