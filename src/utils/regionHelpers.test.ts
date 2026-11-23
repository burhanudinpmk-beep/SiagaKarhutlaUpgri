import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_REGION_ID, KALBAR_REGIONS } from '../data/kalbarRegions';
import {
  buildMissionRoutes,
  computeStatusSummary,
  filterRegionsByStatus,
  findRegionById,
  getStatusPresentation,
} from './regionHelpers';

test('findRegionById resolves valid Kalbar region ids case-insensitively and returns undefined for unknown ids', () => {
  const kubuRaya = findRegionById('kubu-raya');
  assert.ok(kubuRaya);
  assert.equal(kubuRaya.name, 'Kabupaten Kubu Raya');

  const trimmed = findRegionById('  KETAPANG ');
  assert.ok(trimmed);
  assert.equal(trimmed.id, 'ketapang');

  assert.equal(findRegionById('wilayah-tidak-ada'), undefined);
  assert.equal(findRegionById(undefined), undefined);
});

test('filterRegionsByStatus filters regions accurately across all status tiers', () => {
  const all = filterRegionsByStatus(KALBAR_REGIONS, 'semua');
  assert.equal(all.length, KALBAR_REGIONS.length);

  const bahaya = filterRegionsByStatus(KALBAR_REGIONS, 'bahaya');
  assert.equal(bahaya.length, 2);
  assert.ok(bahaya.every((r) => r.status === 'bahaya'));

  const waspada = filterRegionsByStatus(KALBAR_REGIONS, 'waspada');
  assert.equal(waspada.length, 2);
  assert.ok(waspada.every((r) => r.status === 'waspada'));

  const cukupAman = filterRegionsByStatus(KALBAR_REGIONS, 'cukup-aman');
  assert.equal(cukupAman.length, 2);
  assert.ok(cukupAman.every((r) => r.status === 'cukup-aman'));

  const aman = filterRegionsByStatus(KALBAR_REGIONS, 'aman');
  assert.equal(aman.length, 0);
});

test('computeStatusSummary counts totals and per-status breakdown cleanly', () => {
  const summary = computeStatusSummary(KALBAR_REGIONS);
  assert.equal(summary.total, 6);
  assert.equal(summary.bahaya, 2);
  assert.equal(summary.waspada, 2);
  assert.equal(summary.cukupAman, 2);
  assert.equal(summary.aman, 0);
});

test('getStatusPresentation maps status to explicit Indonesian labels', () => {
  assert.equal(getStatusPresentation('bahaya').label, 'Bahaya');
  assert.equal(getStatusPresentation('waspada').label, 'Waspada');
  assert.equal(getStatusPresentation('cukup-aman').label, 'Cukup Aman');
  assert.equal(getStatusPresentation('aman').label, 'Aman');
});

test('buildMissionRoutes generates consistent paths and falls back to default region for invalid id', () => {
  const valid = buildMissionRoutes('sintang');
  assert.deepEqual(valid, {
    home: '/',
    map: '/peta-kalbar',
    briefing: '/briefing/sintang',
    simulation: '/simulasi/sintang',
    result: '/hasil/sintang',
  });

  const fallback = buildMissionRoutes('unknown-id');
  assert.equal(fallback.briefing, `/briefing/${DEFAULT_REGION_ID}`);
  assert.equal(fallback.simulation, `/simulasi/${DEFAULT_REGION_ID}`);
  assert.equal(fallback.result, `/hasil/${DEFAULT_REGION_ID}`);
});
