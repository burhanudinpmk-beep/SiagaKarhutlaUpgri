import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_KALBAR_REGIONS } from '../data/kalbarRegions';
import { INITIAL_SIMULATION_HOTSPOTS } from './gisEngine';
import {
  buildBriefingUrl,
  buildResultUrl,
  buildSimulationUrl,
  resolveMissionBriefing,
} from './briefingHelpers';
import { buildMissionRoutes } from './regionHelpers';

test('resolveMissionBriefing resolves regionId and missionId with matching land type and fictional commander', () => {
  const briefing = resolveMissionBriefing('ketapang', 'sim-02');
  assert.ok(briefing);
  assert.equal(briefing.regionId, 'ketapang');
  assert.equal(briefing.missionId, 'sim-02');
  assert.equal(briefing.missionCode, 'SIM-KTP-01');
  assert.equal(briefing.landType, 'Rawa Gambut Selatan');
  assert.equal(briefing.commander.isFictional, true);
  assert.ok(briefing.commander.disclaimer.toLowerCase().includes('fiktif'));
  assert.equal(briefing.caseStudies.length, 2);
  assert.notEqual(briefing.caseStudies[0].title, briefing.caseStudies[1].title);
  assert.notEqual(briefing.caseStudies[0].narrative, briefing.caseStudies[1].narrative);
});

test('all 14 Kalbar regencies produce unique, non-repeated commander dialogs and 2 distinct case studies', () => {
  const seenDialogs = new Set<string>();

  for (const region of ALL_KALBAR_REGIONS) {
    const briefing = resolveMissionBriefing(region.id);
    assert.ok(briefing, `Missing briefing for ${region.id}`);

    const joinedDialog = briefing.dialogLines.join(' ');
    assert.ok(joinedDialog.length > 60);
    assert.equal(
      seenDialogs.has(joinedDialog),
      false,
      `Duplicate dialog detected for region ${region.id}`
    );
    seenDialogs.add(joinedDialog);

    assert.equal(briefing.caseStudies.length, 2);
    assert.notEqual(briefing.caseStudies[0].id, briefing.caseStudies[1].id);
    assert.notEqual(briefing.caseStudies[0].title, briefing.caseStudies[1].title);
    assert.ok(briefing.environmentMetrics.length >= 4);
  }
});

test('randomized hotspot override updates briefing missionId, landType, and coordinates accurately', () => {
  const customSpot = {
    ...INITIAL_SIMULATION_HOTSPOTS[0],
    id: 'sim-07',
    code: 'SIM-KB-07',
    regionId: 'melawi',
    regionName: 'Kabupaten Melawi',
    scenarioTitle: 'Pos Pantau Elevasi Nanga Pinoh',
    landType: 'Lembah Sungai Melawi',
    lat: -0.45,
    lng: 111.82,
  };

  const briefing = resolveMissionBriefing('melawi', 'sim-07', customSpot);
  assert.ok(briefing);
  assert.equal(briefing.missionId, 'sim-07');
  assert.equal(briefing.missionCode, 'SIM-KB-07');
  assert.equal(briefing.landType, 'Lembah Sungai Melawi');
  assert.equal(briefing.coordinateLabel, '-0.4500, 111.8200');
  assert.ok(briefing.dialogLines.join(' ').includes('Pos Pantau Elevasi Nanga Pinoh'));
});

test('resolveMissionBriefing returns undefined for invalid regionId', () => {
  assert.equal(resolveMissionBriefing('tidak-ada', 'sim-01'), undefined);
});

test('buildSimulationUrl, buildBriefingUrl, buildResultUrl, and buildMissionRoutes preserve missionId cleanly', () => {
  assert.equal(
    buildSimulationUrl('kubu-raya', 'sim-01'),
    '/simulasi/kubu-raya?missionId=sim-01'
  );
  assert.equal(
    buildBriefingUrl('sintang', 'sim-04'),
    '/briefing/sintang?missionId=sim-04'
  );
  assert.equal(
    buildResultUrl('ketapang', 'sim-02'),
    '/hasil/ketapang?missionId=sim-02'
  );
  assert.equal(buildSimulationUrl('sanggau'), '/simulasi/sanggau');

  const routes = buildMissionRoutes('ketapang', 'sim-02');
  assert.equal(routes.briefing, '/briefing/ketapang?missionId=sim-02');
  assert.equal(routes.simulation, '/simulasi/ketapang?missionId=sim-02');
  assert.equal(routes.result, '/hasil/ketapang?missionId=sim-02');
});
