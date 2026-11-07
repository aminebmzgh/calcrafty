import { describe, expect, it } from 'vitest';
import { formatLive, live, type LiveSeries } from './index.ts';

const base: LiveSeries = { value: 7.18, asOf: '2026-11-05', label: 'x', source: 'y', seriesId: 'Z', url: 'https://example.com' };

describe('live data formatting', () => {
  it('rates read as percentages', () => expect(formatLive(base)).toBe('7.18%'));
  it('prices read as dollars per unit', () => {
    expect(formatLive({ ...base, value: 4.153, unit: 'usd', per: 'gallon' })).toBe('$4.153 per gallon');
    expect(formatLive({ ...base, value: 0.196, unit: 'usd', per: 'kWh' })).toBe('$0.196 per kWh');
  });
  it('snapshot has the price series with units', () => {
    expect(live.series.gasPrice.unit).toBe('usd');
    expect(live.series.electricityPrice.per).toBe('kWh');
  });
});
