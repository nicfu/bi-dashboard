
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dashboardDataTable } from '../db/schema';
import { type CreateDashboardDataInput } from '../schema';
import { createDashboardData } from '../handlers/create_dashboard_data';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateDashboardDataInput = {
  metric_name: 'Total Revenue',
  metric_value: 15000.50,
  metric_type: 'revenue',
  date_recorded: new Date('2024-01-15'),
  source: 'manual'
};

describe('createDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create dashboard data', async () => {
    const result = await createDashboardData(testInput);

    // Basic field validation
    expect(result.metric_name).toEqual('Total Revenue');
    expect(result.metric_value).toEqual(15000.50);
    expect(typeof result.metric_value).toBe('number');
    expect(result.metric_type).toEqual('revenue');
    expect(result.date_recorded).toEqual(new Date('2024-01-15'));
    expect(result.source).toEqual('manual');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save dashboard data to database', async () => {
    const result = await createDashboardData(testInput);

    // Query using proper drizzle syntax
    const dashboardData = await db.select()
      .from(dashboardDataTable)
      .where(eq(dashboardDataTable.id, result.id))
      .execute();

    expect(dashboardData).toHaveLength(1);
    expect(dashboardData[0].metric_name).toEqual('Total Revenue');
    expect(parseFloat(dashboardData[0].metric_value)).toEqual(15000.50);
    expect(dashboardData[0].metric_type).toEqual('revenue');
    expect(dashboardData[0].date_recorded).toEqual(new Date('2024-01-15'));
    expect(dashboardData[0].source).toEqual('manual');
    expect(dashboardData[0].created_at).toBeInstanceOf(Date);
  });

  it('should use default date when not provided', async () => {
    const inputWithoutDate = {
      metric_name: 'Job Count',
      metric_value: 250,
      metric_type: 'jobs' as const,
      source: 'manual'
    };

    const result = await createDashboardData(inputWithoutDate);

    expect(result.date_recorded).toBeInstanceOf(Date);
    expect(result.metric_name).toEqual('Job Count');
    expect(result.metric_value).toEqual(250);
    expect(result.metric_type).toEqual('jobs');
    expect(result.source).toEqual('manual');
  });

  it('should handle different metric types correctly', async () => {
    const customerMetric = {
      metric_name: 'Active Customers',
      metric_value: 1200,
      metric_type: 'customers' as const,
      source: 'manual'
    };

    const result = await createDashboardData(customerMetric);

    expect(result.metric_type).toEqual('customers');
    expect(result.metric_name).toEqual('Active Customers');
    expect(result.metric_value).toEqual(1200);
    expect(typeof result.metric_value).toBe('number');
  });

  it('should handle performance metrics with decimal values', async () => {
    const performanceMetric = {
      metric_name: 'System Uptime',
      metric_value: 99.95,
      metric_type: 'performance' as const,
      source: 'automated'
    };

    const result = await createDashboardData(performanceMetric);

    expect(result.metric_type).toEqual('performance');
    expect(result.metric_value).toEqual(99.95);
    expect(typeof result.metric_value).toBe('number');
    expect(result.source).toEqual('automated');
  });
});
