
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dashboardDataTable } from '../db/schema';
import { type CreateDashboardDataInput, type DashboardFilter } from '../schema';
import { getDashboardData } from '../handlers/get_dashboard_data';

// Test data setup
const testData: CreateDashboardDataInput[] = [
  {
    metric_name: 'Total Revenue',
    metric_value: 15000.50,
    metric_type: 'revenue',
    source: 'simpro_api'
  },
  {
    metric_name: 'Active Jobs',
    metric_value: 25,
    metric_type: 'jobs',
    source: 'manual'
  },
  {
    metric_name: 'Customer Count',
    metric_value: 150,
    metric_type: 'customers',
    source: 'external_api'
  }
];

describe('getDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to insert test data
  const insertTestData = async () => {
    for (const data of testData) {
      await db.insert(dashboardDataTable)
        .values({
          metric_name: data.metric_name,
          metric_value: data.metric_value.toString(),
          metric_type: data.metric_type,
          source: data.source,
          date_recorded: data.date_recorded || new Date()
        })
        .execute();
    }
  };

  it('should retrieve all dashboard data without filters', async () => {
    await insertTestData();

    const result = await getDashboardData();

    expect(result).toHaveLength(3);
    expect(result[0].metric_name).toBeDefined();
    expect(typeof result[0].metric_value).toBe('number');
    expect(result[0].metric_type).toMatch(/^(revenue|jobs|customers|performance)$/);
    expect(result[0].source).toBeDefined();
    expect(result[0].date_recorded).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter by metric type', async () => {
    await insertTestData();

    const filter: DashboardFilter = {
      metric_type: 'revenue',
      limit: 100
    };

    const result = await getDashboardData(filter);

    expect(result).toHaveLength(1);
    expect(result[0].metric_type).toBe('revenue');
    expect(result[0].metric_name).toBe('Total Revenue');
    expect(result[0].metric_value).toBe(15000.50);
  });

  it('should filter by source', async () => {
    await insertTestData();

    const filter: DashboardFilter = {
      source: 'manual',
      limit: 100
    };

    const result = await getDashboardData(filter);

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('manual');
    expect(result[0].metric_name).toBe('Active Jobs');
  });

  it('should filter by date range', async () => {
    await insertTestData();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter: DashboardFilter = {
      date_from: yesterday,
      date_to: tomorrow,
      limit: 100
    };

    const result = await getDashboardData(filter);

    expect(result.length).toBeGreaterThan(0);
    result.forEach(item => {
      expect(item.date_recorded >= yesterday).toBe(true);
      expect(item.date_recorded <= tomorrow).toBe(true);
    });
  });

  it('should apply multiple filters', async () => {
    await insertTestData();

    const filter: DashboardFilter = {
      metric_type: 'jobs',
      source: 'manual',
      limit: 100
    };

    const result = await getDashboardData(filter);

    expect(result).toHaveLength(1);
    expect(result[0].metric_type).toBe('jobs');
    expect(result[0].source).toBe('manual');
  });

  it('should respect limit parameter', async () => {
    await insertTestData();

    const filter: DashboardFilter = {
      limit: 2
    };

    const result = await getDashboardData(filter);

    expect(result).toHaveLength(2);
  });

  it('should return results ordered by date_recorded descending', async () => {
    // Insert data with specific dates
    const now = new Date();
    const hour1 = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const hour2 = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

    await db.insert(dashboardDataTable)
      .values([
        {
          metric_name: 'Oldest',
          metric_value: '100',
          metric_type: 'revenue',
          source: 'test',
          date_recorded: hour2
        },
        {
          metric_name: 'Newest',
          metric_value: '200',
          metric_type: 'revenue',
          source: 'test',
          date_recorded: now
        },
        {
          metric_name: 'Middle',
          metric_value: '150',
          metric_type: 'revenue',
          source: 'test',
          date_recorded: hour1
        }
      ])
      .execute();

    const result = await getDashboardData();

    expect(result).toHaveLength(3);
    expect(result[0].metric_name).toBe('Newest');
    expect(result[1].metric_name).toBe('Middle');
    expect(result[2].metric_name).toBe('Oldest');
  });

  it('should handle empty results', async () => {
    const filter: DashboardFilter = {
      metric_type: 'performance',
      limit: 100
    };

    const result = await getDashboardData(filter);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
