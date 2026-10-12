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

const sourceFiles = listFiles(join(prototypeDir, 'src')).filter((path) => /\.(?:ts|tsx|css)$/.test(path));
const sourceText = sourceFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
const cssFiles = sourceFiles.filter((path) => path.endsWith('.css'));
const tokenCssPath = join(prototypeDir, 'src', 'tokens.css');
const tokenCssText = readFileSync(tokenCssPath, 'utf8');
const cssText = cssFiles.filter((path) => path !== tokenCssPath).map((path) => readFileSync(path, 'utf8')).join('\n');
const packageLockPath = join(prototypeDir, 'package-lock.json');
const packageLockText = existsSync(packageLockPath) ? readFileSync(packageLockPath, 'utf8') : '';
const dependency = packageJson.dependencies?.['@sens/prototype-kit'];
const expectedDependency = 'file:../../../vendor/sens-prototype-kit-0.1.0-p0.8.tgz';
const assetPath = dependency?.startsWith('file:') ? resolve(prototypeDir, dependency.slice('file:'.length)) : '';
const specText = JSON.stringify(spec);
const resolvedTokens = JSON.parse(readFileSync(join(prototypeDir, 'node_modules', '@sens', 'prototype-kit', 'types', 'design-system', 'tokens.resolved.json'), 'utf8'));
const requiredTokenValues = [
  ['--sens-token-white', resolvedTokens.colorByPath['中性色/白/01 @white']],
  ['--sens-token-text-primary', resolvedTokens.colorByPath['中性色/文字/01_主要 @text-color-transparent']],
  ['--sens-token-text-sub', resolvedTokens.colorByPath['中性色/文字/03_辅助 @text-sub-color-transparent']],
  ['--sens-token-component-primary', resolvedTokens.colorByPath['功能色/01_默认 @component-primary']],
  ['--sens-token-component-active-background', resolvedTokens.colorByPath['功能色/06_选中背景默认 @component-active-background']],
  ['--sens-token-success', resolvedTokens.colorByPath['状态色/成功/01_默认 @success-color']],
  ['--sens-token-spacing-6x', `${resolvedTokens.unit['spacing/6x']}px`],
  ['--sens-token-spacing-8x', `${resolvedTokens.unit['spacing/8x']}px`],
  ['--sens-token-spacing-10x', `${resolvedTokens.unit['spacing/10x']}px`],
  ['--sens-token-size-xxl', `${resolvedTokens.unit['size/xxl']}px`],
  ['--sens-token-radius-xl', `${resolvedTokens.unit['radius/xl']}px`],
  ['--sens-token-font-size-m', `${resolvedTokens.typography['font-size/m']}px`],
  ['--sens-token-line-height-m', `${resolvedTokens.typography['line-height/m']}px`],
  ['--sens-token-divider-width', `${resolvedTokens.divider['width/hairline']}px`],
  ['--sens-token-active-ring', resolvedTokens.shadow['active-ring/functional']],
];

const checks = [
  {
    id: 'sens-fixed-package',
    pass: dependency === expectedDependency && existsSync(assetPath),
    evidence: dependency ?? 'missing',
    message: '必须依赖仓库内固定版本的 @sens/prototype-kit。',
  },
  {
    id: 'sens-only-entry',
    pass: sourceText.includes("from '@sens/prototype-kit'") && !/from\s+['"](?:antd|@ant-design\/[^'"]+)['"]/.test(sourceText),
    evidence: 'src/**/*.{ts,tsx}',
    message: '业务源码不得直接引入 antd。',
  },
  {
    id: 'token-only-color',
    pass: !/#(?:[0-9a-f]{3,8})\b/i.test(cssText) && !/rgba?\(/i.test(cssText),
    evidence: 'src/**/*.css',
    message: '业务样式不得新增 hex、rgb 或 rgba。',
  },
  {
    id: 'token-adapter-provenance',
    pass: requiredTokenValues.every(([name, value]) => tokenCssText.includes(`${name}: ${value};`)),
    evidence: 'src/tokens.css ↔ fixed tokens.resolved.json',
    message: '需求级 Token 适配值必须与固定 SensD 包完全一致。',
  },
  {
    id: 'published-entry-card',
    pass: resolvedTokens.unit['size/xxl'] === 48 && sourceText.includes('<SensEntryCard') && sourceText.includes('<SensSectionTitle') && !cssText.includes('.entry-card {'),
    evidence: 'SensEntryCard + SensSectionTitle from fixed package',
    message: '设置页必须消费正式入口卡片和分组标题，不得在业务 CSS 重写入口卡片。',
  },
  {
    id: 'token-only-units',
    pass: !/\b\d+(?:\.\d+)?px\b/.test(cssText),
    evidence: 'src/**/*.css',
    message: '业务样式尺寸必须引用 Token，不得新增裸 px。',
  },
  {
    id: 'no-antd-overrides',
    pass: !/\.ant-[a-z0-9_-]+/i.test(cssText) && !/!important/i.test(cssText),
    evidence: 'src/**/*.css',
    message: '不得新增 .ant-* 覆盖或 !important。',
  },
  {
    id: 'calendar-token-contract',
    pass: cssText.includes('--trade-success: var(--sens-token-success)') &&
      cssText.includes('--trade-brand: var(--sens-token-component-primary)') &&
      cssText.includes('--trade-space-4: var(--sens-token-spacing-6x)') &&
      cssText.includes('--trade-title-content-gap: var(--sens-token-spacing-4x)') &&
      cssText.includes('--trade-shell-radius: var(--sens-token-radius-xl)'),
    evidence: 'src/styles.css#:root',
    message: '交易日历语义变量必须映射到已有 SensD Token。',
  },
  {
    id: 'portable-lockfile',
    pass: packageLockText.length > 0 && !packageLockText.includes('npm.fe.sensorsdata.cn') && !packageLockText.includes('/Users/'),
    evidence: 'package-lock.json',
    message: '锁文件必须存在且不包含内网源或个人路径。',
  },
  {
    id: 'portable-source',
    pass: !sourceText.includes('/Users/') && !sourceText.includes('file:///Users/'),
    evidence: 'src/**/*',
    message: '交付源码不得依赖个人绝对路径。',
  },
  {
    id: 'review-structure',
    pass: ['requirement', 'sens', 'interaction', 'delivery'].every((key) => spec.review?.[key]) && spec.review?.designStatus === 'awaiting_designer',
    evidence: '../prototype-spec.json#review',
    message: '首次交付必须保留四类检查并等待设计师审核。',
  },
  {
    id: 'traceable-requirements',
    pass: Array.isArray(spec.requirements) && spec.requirements.length >= 14 && spec.requirements.every((item) => item.id && item.description && item.sourceRefs?.length),
    evidence: '../prototype-spec.json#requirements',
    message: '需求必须有稳定 ID 和来源。',
  },
  {
    id: 'sens-mapping-and-gaps',
    pass: spec.designSystem?.mappings?.length >= 8 && spec.designSystem?.gaps?.length >= 2,
    evidence: '../prototype-spec.json#designSystem',
    message: '必须记录 Sens 映射和组件缺口。',
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
