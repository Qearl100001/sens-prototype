import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { resolve } from 'node:path';
import { createSchemaValidator, validatePrototypeSpec } from './lib/prototype-spec-validation.mjs';

const schema = JSON.parse(await readFile(resolve('contracts/prototype-spec.schema.json'), 'utf8'));
const validateSchema = createSchemaValidator(schema);
const samplePaths = [
  'examples/feature-selection/prototype-spec.json',
  'examples/stream-task/prototype-spec.json',
  'examples/trading-calendar/prototype-spec.json',
];
const samples = await Promise.all(samplePaths.map(async (path) => JSON.parse(await readFile(resolve(path), 'utf8'))));

test('the three existing cases pass the Phase A gate', () => {
  for (const sample of samples) assert.deepEqual(validatePrototypeSpec(sample, validateSchema), []);
});

test('ready is rejected when a blocking question remains open', () => {
  const sample = structuredClone(samples[0]);
  sample.stage = 'ready';
  sample.questions.push({ id: 'gate-open', question: 'Unresolved boundary?', blocking: true, status: 'open', resolution: null, sourceRefs: [] });
  assert(validatePrototypeSpec(sample, validateSchema).length > 0);
});

test('ready is rejected when a core readiness check is pending', () => {
  const sample = structuredClone(samples[1]);
  sample.stage = 'ready';
  sample.readiness.checks.pageBoundaries.status = 'pending';
  assert(validatePrototypeSpec(sample, validateSchema).some((error) => error.includes('pageBoundaries is pending')));
});

test('ready is rejected when a blocking inferred requirement remains', () => {
  const sample = structuredClone(samples[2]);
  sample.stage = 'ready';
  sample.requirements.push({
    id: 'gate-inferred',
    description: 'An unconfirmed boundary decision.',
    basis: 'inferred',
    category: 'scope',
    readinessImpact: 'blocking',
    questionRefs: ['TC-Q03'],
    sourceRefs: ['SRC-PRD'],
  });
  assert(validatePrototypeSpec(sample, validateSchema).some((error) => error.includes('blocking inferred requirement')));
});

test('every post-intake page needs an information architecture node', () => {
  const sample = structuredClone(samples[2]);
  sample.informationArchitecture.nodes = sample.informationArchitecture.nodes.filter((node) => node.pageId !== 'TC-P01');
  assert(validatePrototypeSpec(sample, validateSchema).some((error) => error.includes('page TC-P01 has no node')));
});

test('duplicate traceability ids are rejected', () => {
  const sample = structuredClone(samples[0]);
  sample.actors.push(structuredClone(sample.actors[0]));
  assert(validatePrototypeSpec(sample, validateSchema).some((error) => error.includes('duplicate actor id')));
});
