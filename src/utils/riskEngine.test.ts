import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_KALBAR_REGIONS } from '../data/kalbarRegions';
import {
  analyzeContributingFactors,
  calculateVulnerabilityScore,
  classifyRiskCategory,
  createConfiguredRiskModel,
  evaluateFireRisk,
  getSimulationEnvironmentPreset,
  normalizeEnvironmentalParameters,
  SIMULATION_PROVISIONAL_MODEL_CONFIG,
  UNCONFIGURED_SCIENTIFIC_MODEL_CONFIG,
  validateEnvironmentalParameters,
  validateRiskModelConfig,
} from './riskEngine';

test('validateEnvironmentalParameters catches missing, non-numeric, and out-of-range values', () => {
  const missingResult = validateEnvironmentalParameters({
    airTemperatureC: 32,
    airHumidityPct: '',
    rainfallMm: 5,
    peatMoisturePct: 40,
  });

  assert.equal(missingResult.isValid, false);
  assert.equal(missingResult.validParameters, null);
  assert.ok(missingResult.issues.some((i) => i.key === 'airHumidityPct' && i.reason === 'missing'));
  assert.ok(
    missingResult.issues.some((i) => i.key === 'vegetationConditionPct' && i.reason === 'missing')
  );

  const invalidRangeResult = validateEnvironmentalParameters({
    airTemperatureC: 52, // max 45
    airHumidityPct: Number.NaN,
    rainfallMm: -3, // min 0
    peatMoisturePct: 45,
    vegetationConditionPct: 60,
  });

  assert.equal(invalidRangeResult.isValid, false);
  assert.ok(
    invalidRangeResult.issues.some(
      (i) => i.key === 'airTemperatureC' && i.reason === 'out-of-range'
    )
  );
  assert.ok(
    invalidRangeResult.issues.some(
      (i) => i.key === 'airHumidityPct' && i.reason === 'non-numeric'
    )
  );
  assert.ok(
    invalidRangeResult.issues.some((i) => i.key === 'rainfallMm' && i.reason === 'out-of-range')
  );
});

test('normalizeEnvironmentalParameters normalizes direct and inverse polarities accurately', () => {
  const highRiskBoundary = normalizeEnvironmentalParameters({
    airTemperatureC: 45,
    airHumidityPct: 10,
    rainfallMm: 0,
    peatMoisturePct: 0,
    vegetationConditionPct: 0,
  });

  for (const item of highRiskBoundary) {
    assert.equal(item.normalizedRisk, 1, `Expected 1.0 normalized risk for ${item.key}`);
  }

  const lowRiskBoundary = normalizeEnvironmentalParameters({
    airTemperatureC: 15,
    airHumidityPct: 100,
    rainfallMm: 150,
    peatMoisturePct: 100,
    vegetationConditionPct: 100,
  });

  for (const item of lowRiskBoundary) {
    assert.equal(item.normalizedRisk, 0, `Expected 0.0 normalized risk for ${item.key}`);
  }

  const midpoint = normalizeEnvironmentalParameters({
    airTemperatureC: 30, // (30-15)/30 = 0.5
    airHumidityPct: 55, // (100-55)/90 = 0.5
    rainfallMm: 75, // (150-75)/150 = 0.5
    peatMoisturePct: 50, // (100-50)/100 = 0.5
    vegetationConditionPct: 50, // (100-50)/100 = 0.5
  });

  for (const item of midpoint) {
    assert.equal(item.normalizedRisk, 0.5, `Expected 0.5 midpoint risk for ${item.key}`);
  }
});

test('unconfigured scientific template blocks scoring cleanly without inventing arbitrary weights', () => {
  const configValidation = validateRiskModelConfig(UNCONFIGURED_SCIENTIFIC_MODEL_CONFIG);
  assert.equal(configValidation.isReadyForCalculation, false);
  assert.ok(configValidation.errors.length >= 2);

  const result = evaluateFireRisk(
    {
      airTemperatureC: 34,
      airHumidityPct: 48,
      rainfallMm: 4,
      peatMoisturePct: 28,
      vegetationConditionPct: 42,
    },
    UNCONFIGURED_SCIENTIFIC_MODEL_CONFIG
  );

  assert.equal(result.status, 'awaiting-model-configuration');
  assert.ok(result.normalizedParameters !== null);
  assert.equal(result.score, null);
  assert.equal(result.category, null);
});

test('createConfiguredRiskModel validates custom weights, thresholds, and reference strictly', () => {
  assert.throws(() =>
    createConfiguredRiskModel({
      id: 'bad-sum',
      name: 'Invalid Weight Sum',
      scientificMethodReference: 'Test Ref',
      weights: {
        airTemperatureC: 0.4,
        airHumidityPct: 0.2,
        rainfallMm: 0.2,
        peatMoisturePct: 0.2,
        vegetationConditionPct: 0.2, // sum = 1.2
      },
      thresholds: { lowMax: 30, mediumMax: 65 },
    })
  );

  assert.throws(() =>
    createConfiguredRiskModel({
      id: 'bad-thresholds',
      name: 'Invalid Threshold Order',
      scientificMethodReference: 'Test Ref',
      weights: {
        airTemperatureC: 0.2,
        airHumidityPct: 0.2,
        rainfallMm: 0.2,
        peatMoisturePct: 0.2,
        vegetationConditionPct: 0.2,
      },
      thresholds: { lowMax: 70, mediumMax: 50 },
    })
  );

  const customModel = createConfiguredRiskModel({
    id: 'peat-priority-test',
    name: 'Model Uji Prioritas Gambut',
    scientificMethodReference: 'Contoh Referensi Uji Ilmiah (2025)',
    weights: {
      airTemperatureC: 0.15,
      airHumidityPct: 0.15,
      rainfallMm: 0.2,
      peatMoisturePct: 0.35,
      vegetationConditionPct: 0.15,
    },
    thresholds: {
      lowMax: 35,
      mediumMax: 70,
    },
  });

  const evalResult = evaluateFireRisk(
    {
      airTemperatureC: 33, // (33-15)/30 = 0.6
      airHumidityPct: 46, // (100-46)/90 = 0.6
      rainfallMm: 15, // (150-15)/150 = 0.9
      peatMoisturePct: 20, // (100-20)/100 = 0.8
      vegetationConditionPct: 40, // (100-40)/100 = 0.6
    },
    customModel,
    { dataSourceMode: 'input-manual' }
  );

  assert.equal(evalResult.status, 'completed');
  // Expected score: (0.6*0.15 + 0.6*0.15 + 0.9*0.2 + 0.8*0.35 + 0.6*0.15)*100
  // = (0.09 + 0.09 + 0.18 + 0.28 + 0.09)*100 = 73.0
  assert.equal(evalResult.score, 73);
  assert.equal(evalResult.category, 'tinggi');
  assert.ok(evalResult.contributingFactors);
  assert.equal(evalResult.contributingFactors[0].key, 'peatMoisturePct');
  assert.equal(evalResult.scientificExplanation?.parameterExplanations.length, 5);
  assert.ok(
    evalResult.scientificExplanation?.calibrationDisclosure.includes(
      'Contoh Referensi Uji Ilmiah (2025)'
    )
  );
});

test('calculateVulnerabilityScore, classifyRiskCategory, and factor analysis produce consistent low/medium/high categories', () => {
  const normalizedLow = normalizeEnvironmentalParameters(
    getSimulationEnvironmentPreset('kapuas-hulu').parameters
  );
  const normalizedMed = normalizeEnvironmentalParameters(
    getSimulationEnvironmentPreset('sintang').parameters
  );
  const normalizedHigh = normalizeEnvironmentalParameters(
    getSimulationEnvironmentPreset('ketapang').parameters
  );

  const weights = SIMULATION_PROVISIONAL_MODEL_CONFIG.weights!;
  const thresholds = SIMULATION_PROVISIONAL_MODEL_CONFIG.thresholds!;

  const lowScore = calculateVulnerabilityScore(normalizedLow, weights);
  const medScore = calculateVulnerabilityScore(normalizedMed, weights);
  const highScore = calculateVulnerabilityScore(normalizedHigh, weights);

  assert.equal(classifyRiskCategory(lowScore, thresholds), 'rendah');
  assert.equal(classifyRiskCategory(medScore, thresholds), 'sedang');
  assert.equal(classifyRiskCategory(highScore, thresholds), 'tinggi');

  const factors = analyzeContributingFactors(normalizedHigh, weights, highScore);
  for (let i = 0; i < factors.length - 1; i++) {
    assert.ok(factors[i].weightedPoints >= factors[i + 1].weightedPoints);
  }
  const pointsSum = factors.reduce((sum, f) => sum + f.weightedPoints, 0);
  assert.ok(Math.abs(pointsSum - highScore) <= 0.1);
});

test('all 14 Kalbar regions have valid simulation presets explicitly flagged as simulation data', () => {
  for (const region of ALL_KALBAR_REGIONS) {
    const preset = getSimulationEnvironmentPreset(region.id);
    assert.equal(preset.regionId, region.id);
    assert.equal(preset.isSimulation, true);
    assert.ok(preset.simulationTag.includes('SIMULASI'));

    const evalResult = evaluateFireRisk(
      preset.parameters,
      SIMULATION_PROVISIONAL_MODEL_CONFIG,
      { dataSourceMode: 'simulasi' }
    );
    assert.equal(evalResult.status, 'completed');
    assert.equal(evalResult.isSimulationData, true);
    assert.ok(evalResult.scientificExplanation?.parameterExplanations.length === 5);
  }
});
