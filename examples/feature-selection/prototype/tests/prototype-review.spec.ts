import { expect, test, type Page } from '@playwright/test';

const APP_CHANNEL = 'App 安装渠道';
const CTMD = 'Exclusion Rules for CTMD';

function watchRuntime(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    errors.push(`requestfailed: ${request.url()} — ${request.failure()?.errorText ?? 'unknown'}`);
  });
  return errors;
}

async function openFeatureDrawer(page: Page) {
  await page.getByRole('button', { name: '添加特征', exact: true }).click();
  const drawer = page.locator('[role="dialog"]').last();
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('添加特征', { exact: true })).toBeVisible();
  await page.waitForTimeout(350);
  return drawer;
}

async function selectFeatures(page: Page, labels: string[]) {
  const drawer = await openFeatureDrawer(page);
  const group = drawer.getByRole('button', { name: /普通属性/ });
  if ((await group.getAttribute('aria-expanded')) !== 'true') await group.click();
  for (const label of labels) {
    await drawer.getByText(label, { exact: true }).click();
    await expect(drawer.getByRole('checkbox', { name: label, exact: true })).toBeChecked();
  }
  return drawer;
}

async function saveSelectedFeatures(page: Page, labels: string[]) {
  const drawer = await selectFeatures(page, labels);
  const save = drawer.getByRole('button', { name: /保\s*存/ });
  await save.click();
  await expect(save).toBeDisabled();
  await expect(drawer).toHaveCount(0, { timeout: 3_000 });
  for (const label of labels) await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '创建模板' })).toBeVisible();
});

test('需求：特征、特征值与单选应用形成完整交互闭环', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '业务闭环只需在标准桌面宽度运行一次。');
  const runtimeErrors = watchRuntime(page);

  await saveSelectedFeatures(page, [APP_CHANNEL, CTMD]);

  const appRow = page.locator('.feature-item').filter({ has: page.getByText(APP_CHANNEL, { exact: true }) });
  await appRow.getByRole('button', { name: '添加特征值', exact: true }).click();
  const valueDrawer = page.locator('[role="dialog"]').last();
  await expect(valueDrawer.getByText(`添加特征值 - ${APP_CHANNEL}`, { exact: true })).toBeVisible();
  await valueDrawer.getByText('App Store', { exact: true }).click();
  await valueDrawer.getByRole('button', { name: /保\s*存/ }).click();
  await expect(valueDrawer).toHaveCount(0);
  await expect(appRow.getByRole('checkbox', { name: 'App Store', exact: true })).toBeVisible();

  const ctmdRow = page.locator('.feature-item').filter({ has: page.getByText(CTMD, { exact: true }) });
  await ctmdRow.getByRole('button', { name: '编辑值', exact: true }).click();
  const ctmdDrawer = page.locator('[role="dialog"]').last();
  await ctmdDrawer.getByText('单选', { exact: true }).click();
  await expect(page.getByText('显示方式切换确认', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '确认切换', exact: true }).click();
  await expect(ctmdDrawer.getByRole('checkbox', { name: /展示“其他”/ })).toBeDisabled();
  await ctmdDrawer.getByRole('button', { name: /保\s*存/ }).click();
  await expect(ctmdDrawer).toHaveCount(0);

  const application = page.getByRole('radiogroup', { name: '应用态单选值' });
  await expect(application).toBeVisible();
  await application.getByText('No', { exact: true }).click();
  await expect(application.getByRole('radio', { name: 'No', exact: true })).toBeChecked();
  await expect(application.getByRole('radio', { name: 'Yes', exact: true })).not.toBeChecked();
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});

test('交互：脏数据放弃确认可继续，也可确认退出', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '确认流程只需在标准桌面宽度运行一次。');
  const runtimeErrors = watchRuntime(page);

  const drawer = await selectFeatures(page, ['Age']);
  await drawer.getByRole('button', { name: /放\s*弃/ }).click();
  await expect(page.getByText('确定放弃此次添加吗？', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '继续添加', exact: true }).click();
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: /放\s*弃/ }).click();
  await page.getByRole('button', { name: '确定放弃', exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page.getByText('Age', { exact: true })).toHaveCount(0);
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});

test('视觉与交付：桌面宽度、正文层级、抽屉内边距和资源均正常', async ({ page }) => {
  const runtimeErrors = watchRuntime(page);
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    sectionGap: getComputedStyle(document.querySelector('.template-page') as HTMLElement).gap,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.sectionGap).toBe('40px');

  const drawer = await openFeatureDrawer(page);
  const drawerBody = drawer.locator(':scope > div').nth(1);
  await expect(drawerBody).toBeVisible();
  const bodyStyle = await drawerBody.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      top: style.paddingTop,
      right: style.paddingRight,
      bottom: style.paddingBottom,
      left: style.paddingLeft,
    };
  });
  expect(bodyStyle).toEqual({ top: '16px', right: '24px', bottom: '24px', left: '24px' });

  const bodyTypography = await drawer.locator('.source-count').evaluate((element) => {
    const style = getComputedStyle(element);
    return { fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight };
  });
  expect(bodyTypography).toEqual({ fontSize: '14px', lineHeight: '22px', fontWeight: '400' });

  const drawerBounds = await drawer.boundingBox();
  expect(drawerBounds).not.toBeNull();
  expect(drawerBounds!.x).toBeGreaterThanOrEqual(0);
  expect(drawerBounds!.x + drawerBounds!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(await drawer.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});

test('交互门禁：延期按钮禁用，放弃与提交均有完整反馈', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '控件审计只需在标准桌面宽度运行一次。');
  const runtimeErrors = watchRuntime(page);
  await expect(page.getByRole('button', { name: '添加特征组', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '添加黑名单范围', exact: true })).toBeDisabled();

  await saveSelectedFeatures(page, ['Age']);
  const submit = page.getByRole('button', { name: /提\s*交/ });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(page.getByText('创建成功', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '返回', exact: true }).click();
  await expect(page.getByText('确定放弃本次创建吗？', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '继续编辑', exact: true }).click();
  await expect(page.getByText('Age', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /放\s*弃/ }).click();
  await page.getByRole('button', { name: '确定放弃', exact: true }).click();
  await expect(page.getByText('已放弃本次创建', { exact: true })).toBeVisible();
  await expect(page.getByText('Age', { exact: true })).toHaveCount(0);

  await page.goto('/?submitResult=failure');
  await saveSelectedFeatures(page, ['Age']);
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByText('创建失败，请稍后重试', { exact: true })).toBeVisible();
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});
