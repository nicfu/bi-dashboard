
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { fetchExternalData } from '../handlers/fetch_external_data';
import { type ExternalApiData } from '../schema';

describe('fetchExternalData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch external API data successfully', async () => {
    const result = await fetchExternalData();

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);

    // Verify each item has required structure
    result.forEach(item => {
      expect(item.metric).toBeDefined();
      expect(typeof item.metric).toBe('string');
      expect(typeof item.value).toBe('number');
      expect(['revenue', 'jobs', 'customers', 'performance']).toContain(item.type);
      expect(item.timestamp).toBeDefined();
      expect(typeof item.timestamp).toBe('string');
      expect(item.source).toBeDefined();
      expect(typeof item.source).toBe('string');
    });
  });

  it('should return data with valid metric types', async () => {
    const result = await fetchExternalData();

    const validTypes = ['revenue', 'jobs', 'customers', 'performance'];
    const returnedTypes = result.map(item => item.type);
    
    returnedTypes.forEach(type => {
      expect(validTypes).toContain(type);
    });

    // Should have at least one of each type for comprehensive data
    expect(returnedTypes).toContain('revenue');
    expect(returnedTypes).toContain('jobs');
    expect(returnedTypes).toContain('customers');
    expect(returnedTypes).toContain('performance');
  });

  it('should return data with valid timestamp format', async () => {
    const result = await fetchExternalData();

    result.forEach(item => {
      // Timestamp should be valid ISO string
      const date = new Date(item.timestamp);
      expect(date.getTime()).not.toBeNaN();
      
      // Should be recent (within last week for mock data)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      expect(date.getTime()).toBeGreaterThan(oneWeekAgo.getTime());
    });
  });

  it('should return consistent data structure', async () => {
    const result1 = await fetchExternalData();
    const result2 = await fetchExternalData();

    // Should return same number of items (mock data is consistent)
    expect(result1.length).toBe(result2.length);

    // Should have same metric names structure
    const metrics1 = result1.map(item => item.metric).sort();
    const metrics2 = result2.map(item => item.metric).sort();
    expect(metrics1).toEqual(metrics2);
  });

  it('should return numeric values for all metrics', async () => {
    const result = await fetchExternalData();

    result.forEach(item => {
      expect(typeof item.value).toBe('number');
      expect(item.value).toBeGreaterThan(0);
      expect(Number.isFinite(item.value)).toBe(true);
    });
  });
});
