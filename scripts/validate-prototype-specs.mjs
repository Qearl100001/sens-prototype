import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createSchemaValidator, validatePrototypeSpec } from './lib/prototype-spec-validation.mjs';

const paths = process.argv.slice(2);
if (!paths.length) throw new Error('Pass at least one prototype-spec.json path.');

const schema = JSON.parse(await readFile(resolve('contracts/prototype-spec.schema.json'), 'utf8'));
const schemaValidator = createSchemaValidator(schema);
let failed = false;

for (const inputPath of paths) {
  const absolutePath = resolve(inputPath);
  const spec = JSON.parse(await readFile(absolutePath, 'utf8'));
  const errors = validatePrototypeSpec(spec, schemaValidator);
  if (errors.length) {
    failed = true;
    console.error(`FAIL ${inputPath}`);
    for (const error of errors) console.error(`  - ${error}`);
  } else {
    console.log(`PASS ${inputPath} (${spec.stage}, ${spec.readiness.decision})`);
  }
}

if (failed) process.exit(1);
