import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const exampleDir = resolve(process.argv[2] ?? '');
const prototypeDir = resolve(exampleDir, 'prototype');
const specPath = resolve(exampleDir, 'prototype-spec.json');
const catalogPath = resolve(prototypeDir, 'node_modules/@sens/prototype-kit/catalog.json');

if (!existsSync(specPath)) throw new Error(`Missing prototype spec: ${specPath}`);
if (!existsSync(catalogPath)) throw new Error(`Install the fixed Prototype Kit before checking assets: ${catalogPath}`);

const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const pageIds = new Set((spec.pages ?? []).map((page) => page.id));
const templates = new Map((catalog.templates ?? []).map((item) => [item.id, item]));
const compositeIds = new Set((catalog.composites ?? []).map((item) => item.id));
const failures = [];

function checkRefs(field, available, kind) {
  const refs = spec.designSystem?.[field];
  if (!Array.isArray(refs) || refs.length === 0) {
    failures.push(`${field} must declare at least one ${kind}`);
    return;
  }
  for (const ref of refs) {
    if (!pageIds.has(ref.pageId)) failures.push(`${field}: unknown pageId ${ref.pageId}`);
    if (!available.has(ref.assetId)) failures.push(`${field}: ${ref.assetId} is not in installed catalog`);
  }
}

checkRefs('templateRefs', new Set(templates.keys()), 'page template');
checkRefs('compositeRefs', compositeIds, 'composite');

for (const ref of spec.designSystem?.templateRefs ?? []) {
  const template = templates.get(ref.assetId);
  if (!ref.pageLevel) failures.push(`templateRefs: ${ref.assetId} must declare pageLevel`);
  if (template && ref.pageLevel !== template.pageLevel) {
    failures.push(`templateRefs: ${ref.assetId} is ${template.pageLevel}, spec declares ${ref.pageLevel}`);
  }
}

const installedVersion = catalog.version;
const expectedVersion = spec.designSystem?.version?.replace('@sens/prototype-kit@', '');
if (expectedVersion !== installedVersion) {
  failures.push(`spec expects ${expectedVersion ?? 'no version'}, installed catalog is ${installedVersion}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exit(1);
}

console.log(`PASS ${spec.designSystem.templateRefs.length} template refs and ${spec.designSystem.compositeRefs.length} composite refs`);
console.log(`PASS @sens/prototype-kit ${installedVersion} catalog linkage`);
