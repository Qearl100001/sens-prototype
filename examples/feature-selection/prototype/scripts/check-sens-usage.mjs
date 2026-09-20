import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const prototypeDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const exampleDir = resolve(prototypeDir, '..');
const packageJson = JSON.parse(readFileSync(join(prototypeDir, 'package.json'), 'utf8'));
const spec = JSON.parse(readFileSync(join(exampleDir, 'prototype-spec.json'), 'utf8'));

const listFiles = (directory) => readdirSync(directory).flatMap((entry) => {
  const path = join(directory, entry);
  return statSync(path).isDirectory() ? listFiles(path) : [path];
});

const sourceFiles = listFiles(join(prototypeDir, 'src'))
  .filter((path) => /\.(?:ts|tsx|css)$/.test(path));
const sourceText = sourceFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
const packageLockText = readFileSync(join(prototypeDir, 'package-lock.json'), 'utf8');
const specText = JSON.stringify(spec);
const dependency = packageJson.dependencies?.['@sens/prototype-kit'];
const expectedDependency = 'file:../../../vendor/sens-prototype-kit-0.1.0-p0.6.tgz';
const assetPath = dependency?.startsWith('file:')
  ? resolve(prototypeDir, dependency.slice('file:'.length))
  : '';

const checks = [
  {
    id: 'sens-fixed-package',
    pass: dependency === expectedDependency && existsSync(assetPath),
    evidence: dependency ?? 'missing',
    message: '原型必须依赖仓库内固定版本的 @sens/prototype-kit 资产。',
  },
  {
    id: 'sens-only-entry',
    pass: sourceText.includes("from '@sens/prototype-kit'") &&
      !/from\s+['"](?:antd|@ant-design\/[^'"]+)['"]/.test(sourceText),
    evidence: 'src/**/*.{ts,tsx}',
    message: '业务源码必须从 @sens/prototype-kit 消费组件，不得直接引入 antd。',
  },
  {
    id: 'portable-lockfile',
    pass: !packageLockText.includes('npm.fe.sensorsdata.cn') && !packageLockText.includes('/Users/'),
    evidence: 'package-lock.json',
    message: '锁文件不得包含公司内网源或个人绝对路径。',
  },
  {
    id: 'portable-source',
    pass: !sourceText.includes('/Users/') && !sourceText.includes('file:///Users/'),
    evidence: 'src/**/*.{ts,tsx,css}',
    message: '交付源码不得依赖个人绝对路径。',
  },
  {
    id: 'review-structure',
    pass: ['requirement', 'sens', 'interaction', 'delivery']
      .every((key) => spec.review && spec.review[key]) &&
      spec.review?.designStatus === 'awaiting_designer',
    evidence: '../prototype-spec.json#review',
    message: '规格必须保留四类验收结果，且设计师审核前不得自动标记完成。',
  },
  {
    id: 'traceable-requirements',
    pass: Array.isArray(spec.requirements) && spec.requirements.length > 0 &&
      spec.requirements.every((item) => item.id && item.description && Array.isArray(item.sourceRefs)),
    evidence: '../prototype-spec.json#requirements',
    message: '每条需求必须有稳定 ID、说明和来源引用。',
  },
  {
    id: 'sens-mapping-and-gaps',
    pass: Array.isArray(spec.designSystem?.mappings) && spec.designSystem.mappings.length > 0 &&
      Array.isArray(spec.designSystem?.gaps),
    evidence: '../prototype-spec.json#designSystem',
    message: '必须记录 Sens 组件映射和已知组件缺口。',
  },
  {
    id: 'no-personal-path-in-spec',
    pass: !specText.includes('/Users/') && !specText.includes('file:///Users/'),
    evidence: '../prototype-spec.json',
    message: '规格不得包含个人绝对路径。',
  },
];

for (const check of checks) {
  const mark = check.pass ? 'PASS' : 'FAIL';
  console.log(`${mark} ${check.id} — ${check.evidence}`);
  if (!check.pass) console.error(`  ${check.message}`);
}

const failed = checks.filter((check) => !check.pass);
console.log(`\nSens 使用检查：${checks.length - failed.length}/${checks.length} 通过`);
if (failed.length > 0) process.exit(1);
