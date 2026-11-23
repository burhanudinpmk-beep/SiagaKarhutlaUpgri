import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMissionProgress,
  filterHotspotsByRisk,
  filterHotspotsByZone,
  findRegencyAtCoordinate,
  generateRandomizedHotspots,
  getKalbarBounds,
  getKalbarGeoJson,
  getZoneIdForRegion,
  INITIAL_SIMULATION_HOTSPOTS,
  isPointInsideKalbar,
  KALBAR_GAME_ZONES,
  KALBAR_GEOJSON_METADATA,
  MAP_TILE_LAYERS,
} from './gisEngine';

test('Kalbar GeoJSON dataset contains all 14 kabupaten/kota with valid source metadata', () => {
  const geo = getKalbarGeoJson();
  assert.equal(geo.features.length, 14);
  assert.equal(KALBAR_GEOJSON_METADATA.regencyCount, 14);
  assert.ok(KALBAR_GEOJSON_METADATA.source.includes('Badan Pusat Statistik'));
});

test('getKalbarBounds stays within authentic West Kalimantan geographic extent', () => {
  const [[minLat, minLng], [maxLat, maxLng]] = getKalbarBounds();
  assert.ok(minLat >= -3.2 && minLat <= -2.5);
  assert.ok(maxLat >= 1.8 && maxLat <= 2.2);
  assert.ok(minLng >= 108.4 && minLng <= 109.1);
  assert.ok(maxLng >= 113.8 && maxLng <= 114.3);
});

test('isPointInsideKalbar accepts West Kalimantan cities and rejects external coordinates', () => {
  // Pontianak, Kubu Raya, Putussibau are inside Kalimantan Barat
  assert.equal(isPointInsideKalbar(-0.0296, 109.3281), true);
  assert.equal(isPointInsideKalbar(-0.26, 109.48), true);
  assert.equal(isPointInsideKalbar(0.85, 112.92), true);

  const kubuRaya = findRegencyAtCoordinate(-0.26, 109.48);
  assert.ok(kubuRaya);
  assert.equal(kubuRaya.regionId, 'kubu-raya');

  // Jakarta, Sarawak (Kuching), and open Natuna Sea are outside Kalimantan Barat
  assert.equal(isPointInsideKalbar(-6.2, 106.816), false);
  assert.equal(isPointInsideKalbar(1.553, 110.359), false);
  assert.equal(isPointInsideKalbar(0.5, 107.5), false);
});

test('all initial simulation hotspots have simulation labels, zero initial aman status, and lie strictly inside Kalbar GeoJSON', () => {
  assert.equal(INITIAL_SIMULATION_HOTSPOTS.length, 15);
  assert.equal(
    INITIAL_SIMULATION_HOTSPOTS.some((spot) => spot.riskLevel === 'aman'),
    false,
    'Tidak boleh ada titik api awal berstatus aman sebelum dikerjakan'
  );
  assert.equal(
    INITIAL_SIMULATION_HOTSPOTS.filter((s) => s.riskLevel === 'bahaya').length,
    5
  );
  assert.equal(
    INITIAL_SIMULATION_HOTSPOTS.filter((s) => s.riskLevel === 'waspada').length,
    5
  );
  assert.equal(
    INITIAL_SIMULATION_HOTSPOTS.filter((s) => s.riskLevel === 'cukup-aman').length,
    5
  );

  const geoRegencyIds = new Set(
    getKalbarGeoJson().features.map((f) =>
      f.properties.shapeName.trim().toLowerCase().replace(/\s+/g, '-')
    )
  );
  const initialRegencyIds = new Set(
    INITIAL_SIMULATION_HOTSPOTS.map((spot) => spot.regionId)
  );
  assert.equal(
    initialRegencyIds.size,
    14,
    'Titik api awal harus tersebar di seluruh 14 kab/kota Kalimantan Barat'
  );
  assert.deepEqual(initialRegencyIds, geoRegencyIds);

  for (const spot of INITIAL_SIMULATION_HOTSPOTS) {
    assert.equal(spot.isSimulation, true);
    assert.ok(spot.simulationLabel.toLowerCase().includes('simulasi'));
    assert.ok([5, 6, 7].includes(spot.challengeCount));
    assert.equal(
      isPointInsideKalbar(spot.lat, spot.lng),
      true,
      `Initial hotspot ${spot.code} (${spot.lat}, ${spot.lng}) must be inside Kalbar`
    );
    const matched = findRegencyAtCoordinate(spot.lat, spot.lng);
    assert.equal(
      matched?.regionId,
      spot.regionId,
      `Initial hotspot ${spot.code} must lie inside ${spot.regionId}, got ${matched?.regionId}`
    );
  }
});

test('resolveEffectiveHotspotRisk transitions hotspot to aman only when scenarioStatus is selesai', async () => {
  const { resolveEffectiveHotspotRisk } = await import('./gisEngine');
  assert.equal(resolveEffectiveHotspotRisk('bahaya', 'belum-dikerjakan'), 'bahaya');
  assert.equal(resolveEffectiveHotspotRisk('waspada', 'sedang-berjalan'), 'waspada');
  assert.equal(resolveEffectiveHotspotRisk('cukup-aman', 'belum-dikerjakan'), 'cukup-aman');
  assert.equal(resolveEffectiveHotspotRisk('aman', 'belum-dikerjakan'), 'cukup-aman');
  assert.equal(resolveEffectiveHotspotRisk('bahaya', 'selesai'), 'aman');
  assert.equal(resolveEffectiveHotspotRisk('waspada', 'selesai'), 'aman');
  assert.equal(resolveEffectiveHotspotRisk('cukup-aman', 'selesai'), 'aman');
});

test('generateRandomizedHotspots always generates 15 non-aman coordinates strictly inside Kalbar across repeated runs', () => {
  let seed = 42;
  const deterministicRng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let run = 0; run < 5; run++) {
    const spots = generateRandomizedHotspots(15, deterministicRng);
    assert.equal(spots.length, 15);
    assert.equal(
      new Set(spots.map((s) => s.regionId)).size,
      14,
      'Hasil acak titik api tetap harus mencakup seluruh 14 kab/kota'
    );
    for (const spot of spots) {
      assert.equal(spot.isSimulation, true);
      assert.notEqual(spot.riskLevel, 'aman');
      assert.ok([5, 6, 7].includes(spot.challengeCount));
      assert.equal(
        isPointInsideKalbar(spot.lat, spot.lng),
        true,
        `Randomized hotspot ${spot.code} in ${spot.regionName} (${spot.lat}, ${spot.lng}) must be inside Kalbar`
      );
      const matched = findRegencyAtCoordinate(spot.lat, spot.lng);
      assert.equal(
        matched?.regionId,
        spot.regionId,
        `Randomized hotspot ${spot.code} must lie inside ${spot.regionId}`
      );
    }
  }
});

test('tile layer configurations include Satellite, Topographic, and Dark Tactical with attributions', () => {
  assert.ok(MAP_TILE_LAYERS.satellite.attribution.length > 10);
  assert.ok(MAP_TILE_LAYERS.topographic.attribution.length > 10);
  assert.ok(MAP_TILE_LAYERS['dark-tactical'].attribution.length > 10);
});

test('filterHotspotsByRisk and computeMissionProgress summarize mission statuses accurately', () => {
  const bahayaOnly = filterHotspotsByRisk(INITIAL_SIMULATION_HOTSPOTS, 'bahaya');
  assert.equal(bahayaOnly.length, 5);
  assert.ok(bahayaOnly.every((s) => s.riskLevel === 'bahaya'));

  const cukupAmanOnly = filterHotspotsByRisk(INITIAL_SIMULATION_HOTSPOTS, 'cukup-aman');
  assert.equal(cukupAmanOnly.length, 5);
  assert.ok(cukupAmanOnly.every((s) => s.riskLevel === 'cukup-aman'));

  const progress = computeMissionProgress(INITIAL_SIMULATION_HOTSPOTS);
  assert.equal(progress.total, 15);
  assert.equal(progress.completed + progress.inProgress + progress.pending, 15);
});

test('KALBAR_GAME_ZONES mengelompokkan seluruh titik api secara utuh', () => {
  assert.equal(KALBAR_GAME_ZONES.length, 3);
  const allFiltered = filterHotspotsByZone(INITIAL_SIMULATION_HOTSPOTS, 'semua');
  assert.equal(allFiltered.length, 15);

  const barat = filterHotspotsByZone(INITIAL_SIMULATION_HOTSPOTS, 'barat-gambut');
  const selatan = filterHotspotsByZone(INITIAL_SIMULATION_HOTSPOTS, 'selatan-konservasi');
  const tengah = filterHotspotsByZone(INITIAL_SIMULATION_HOTSPOTS, 'tengah-hulu');

  assert.equal(barat.length, 7);
  assert.equal(selatan.length, 3);
  assert.equal(tengah.length, 5);
  assert.equal(barat.length + selatan.length + tengah.length, 15);

  assert.equal(getZoneIdForRegion('kubu-raya'), 'barat-gambut');
  assert.equal(getZoneIdForRegion('ketapang'), 'selatan-konservasi');
  assert.equal(getZoneIdForRegion('kapuas-hulu'), 'tengah-hulu');
});

