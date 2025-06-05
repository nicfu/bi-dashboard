
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dashboardDataTable } from '../db/schema';
import { syncDashboardData } from '../handlers/sync_dashboard_data';
import { eq } from 'drizzle-orm';

describe('syncDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should sync dashboard data from external API', async () => {
    const results = await syncDashboardData();

    // Should return array of dashboard data
    expect(results).toBeArray();
    expect(results.length).toBeGreaterThan(0);

    // Verify structure of first result
    const firstResult = results[0];
    expect(firstResult.id).toBeDefined();
    expect(firstResult.metric_name).toBeString();
    expect(typeof firstResult.metric_value).toBe('number');
    expect(['revenue', 'jobs', 'customers', 'performance']).toContain(firstResult.metric_type);
    expect(firstResult.date_recorded).toBeInstanceOf(Date);
    expect(firstResult.source).toBeString();
    expect(firstResult.created_at).toBeInstanceOf(Date);
  });

  it('should save synced data to database', async () => {
    const results = await syncDashboardData();

    // Query database to verify data was saved
    const savedRecords = await db.select()
      .from(dashboardDataTable)
      .execute();

    expect(savedRecords.length).toEqual(results.length);

    // Verify data integrity
    for (const result of results) {
      const savedRecord = savedRecords.find(r => r.id === result.id);
      expect(savedRecord).toBeDefined();
      expect(savedRecord!.metric_name).toEqual(result.metric_name);
      expect(parseFloat(savedRecord!.metric_value)).toEqual(result.metric_value);
      expect(savedRecord!.metric_type).toEqual(result.metric_type);
      expect(savedRecord!.source).toEqual(result.source);
    }
  });

  it('should handle different metric types correctly', async () => {
    const results = await syncDashboardData();

    // Check that all expected metric types are present
    const metricTypes = results.map(r => r.metric_type);
    expect(metricTypes).toContain('revenue');
    expect(metricTypes).toContain('jobs');
    expect(metricTypes).toContain('customers');
    expect(metricTypes).toContain('performance');

    // Verify each type has appropriate data
    const revenueMetric = results.find(r => r.metric_type === 'revenue');
    expect(revenueMetric).toBeDefined();
    expect(revenueMetric!.metric_value).toBeGreaterThan(0);

    const jobsMetric = results.find(r => r.metric_type === 'jobs');
    expect(jobsMetric).toBeDefined();
    expect(jobsMetric!.metric_value).toBeGreaterThan(0);
  });

  it('should set correct timestamps', async () => {
    const syncTime = new Date();
    const results = await syncDashboardData();

    // All records should have timestamps close to sync time
    for (const result of results) {
      expect(result.date_recorded).toBeInstanceOf(Date);
      expect(result.created_at).toBeInstanceOf(Date);
      
      // Timestamps should be within reasonable range of sync time (within 1 minute)
      const timeDiff = Math.abs(result.created_at.getTime() - syncTime.getTime());
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
    }
  });

  it('should handle numeric values correctly', async () => {
    const results = await syncDashboardData();

    // Verify numeric conversion works both ways
    for (const result of results) {
      expect(typeof result.metric_value).toBe('number');
      expect(result.metric_value).toBeGreaterThan(0);

      // Check database storage
      const dbRecord = await db.select()
        .from(dashboardDataTable)
        .where(eq(dashboardDataTable.id, result.id))
        .execute();

      expect(dbRecord).toHaveLength(1);
      expect(typeof dbRecord[0].metric_value).toBe('string'); // Stored as string
      expect(parseFloat(dbRecord[0].metric_value)).toEqual(result.metric_value);
    }
  });
});
