import { expect, test, type Page } from '@playwright/test';

function watchRuntime(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', (request) => errors.push(`requestfailed: ${request.url()} — ${request.failure()?.errorText ?? 'unknown'}`));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('trading-calendar')).toBeVisible();
});

test('需求：月视图导航、年视图和月份跳转可操作', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '主流程只需在标准桌面宽度执行一次。');
  await expect(page.getByRole('heading', { name: '2026年9月', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '下一月', exact: true }).click();
  await expect(page.getByRole('heading', { name: '2026年10月', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: '年视图', exact: true }).click();
  await expect(page.getByLabel('2026年日历')).toBeVisible();
  await page.getByRole('button', { name: '查看3月', exact: true }).click();
  await expect(page.getByRole('heading', { name: '2026年3月', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /今\s*天/ }).click();
  await expect(page.getByRole('heading', { name: '2026年9月', exact: true })).toBeVisible();
});

test('需求：基本设置入口卡片下钻到交易日历并保留导航上下文', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '信息架构路径只需在标准桌面宽度执行一次。');
  await expect(page.locator('.sens-product-shell')).toHaveAttribute('data-sens-product-shell-layout', 'vertical');
  await expect(page.locator('.sens-product-shell-side-navigation')).toHaveCount(0);

  await page.getByRole('button', { name: '返回', exact: true }).click();
  const navigation = page.locator('.sens-product-shell-side-navigation');
  await expect(page.getByTestId('basic-settings-page')).toBeVisible();
  await expect(page.locator('.sens-product-shell')).toHaveAttribute('data-sens-product-shell-layout', 't');
  await expect(navigation.getByRole('button', { name: '项目管理', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation.getByRole('button', { name: '基本设置', exact: true })).toBeVisible();
  await expect(navigation.getByRole('button', { name: '交易日历', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '基本设置', exact: true })).toBeVisible();
  await page.getByTestId('basic-settings-page').getByRole('button', { name: '交易日历', exact: true }).click();
  await expect(page.getByTestId('trading-calendar')).toBeVisible();
  await expect(page.locator('.sens-product-shell-side-navigation')).toHaveCount(0);
  await expect(page).toHaveURL(/page=trading-calendar/);

  await page.goBack();
  await expect(page.getByTestId('basic-settings-page')).toBeVisible();
  await page.goForward();
  await expect(page.getByTestId('trading-calendar')).toBeVisible();
});

test('需求：点击历史日期、二次确认并更新状态', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '编辑主流程只需执行一次。');
  await page.getByRole('button', { name: /2026-09-17，非交易日/ }).click();
  await expect(page.getByTestId('single-edit-drawer')).toBeVisible();
  await page.getByTestId('single-edit-drawer').getByText('交易日', { exact: true }).last().click();
  await page.getByPlaceholder('请输入备注').fill('恢复交易');
  await page.getByRole('button', { name: /保\s*存/ }).click();
  await expect(page.getByText('确认修改交易日状态？', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /确认修改/ }).click();
  await expect(page.getByTestId('single-edit-drawer')).toBeHidden();
  await expect(page.getByRole('button', { name: /2026-09-17，交易日，恢复交易/ })).toBeVisible();
});

test('需求：未初始化时管理操作受控，完成站内通知后解锁', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '初始化门禁只需执行一次。');
  await page.goto('/?scenario=uninitialized');
  await expect(page.getByTestId('notification-drawer')).toBeVisible();
  await page.getByRole('button', { name: /暂不配置/ }).click();
  await expect(page.getByText(/请先完成通知初始化/)).toBeVisible();
  await expect(page.getByRole('button', { name: /批量上传/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /编\s*辑/ })).toBeDisabled();
  await page.getByRole('button', { name: /前往配置/ }).click();
  await page.getByTestId('notification-drawer').getByText('站内通知', { exact: true }).last().click();
  await page.getByRole('button', { name: /保存配置/ }).click();
  await expect(page.getByText(/交易日历管理功能已解锁/)).toBeVisible();
  await expect(page.getByRole('button', { name: /批量上传/ })).toBeEnabled();
  await expect(page.getByLabel('交易日历管理').getByRole('button', { name: /编\s*辑/ })).toBeEnabled();
});

test('需求：批量编辑校验并更新日期范围', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '批量编辑只需执行一次。');
  await page.getByRole('button', { name: /编\s*辑/ }).click();
  await expect(page.getByTestId('batch-edit-drawer')).toBeVisible();
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByText('请补充完整且有效的日期范围', { exact: true })).toBeVisible();
  await page.getByLabel('范围 1 开始日期').fill('2026-09-29');
  await page.getByLabel('范围 1 结束日期').fill('2026-09-30');
  await page.getByTestId('batch-edit-drawer').getByText('非交易日', { exact: true }).last().click();
  await page.getByPlaceholder('请输入备注').fill('批量休市');
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByTestId('batch-edit-drawer')).toBeHidden();
  await expect(page.getByRole('button', { name: /2026-09-29，非交易日，批量休市/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /2026-09-30，非交易日，批量休市/ })).toBeVisible();
});

test('需求：批量上传错误与通过状态稳定可复现', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '上传状态只需执行一次。');
  await page.getByRole('button', { name: /批量上传/ }).click();
  const input = page.locator('input[type="file"]');
  await input.setInputFiles({ name: 'format.txt', mimeType: 'text/plain', buffer: Buffer.from('mock') });
  await expect(page.getByText(/文件格式错误/)).toBeVisible();
  await input.setInputFiles({ name: 'content-error.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('mock') });
  await expect(page.getByText(/文件内容填写有误/)).toBeVisible();
  await input.setInputFiles({ name: '2026-trading-calendar.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('mock') });
  await expect(page.getByText(/校验通过/)).toBeVisible();
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByText('导入成功', { exact: true })).toBeVisible();
});

test('Sens：侧导航沿用正式展开收起并让内容自适应', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '产品壳只需执行一次。');
  await page.getByRole('button', { name: '返回', exact: true }).click();
  const navigation = page.locator('.sens-product-shell-side-navigation');
  const content = page.locator('.sens-product-shell__content');
  await expect(navigation.getByRole('button', { name: '项目管理', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation.getByRole('button', { name: '基本设置', exact: true })).toBeVisible();
  const expanded = await content.boundingBox();
  await page.getByRole('button', { name: '收起侧边导航', exact: true }).click();
  const collapsed = await content.boundingBox();
  expect((collapsed?.width ?? 0)).toBeGreaterThan(expanded?.width ?? 0);
  await expect(page.getByRole('button', { name: '展开侧边导航', exact: true })).toBeVisible();
});

test('Sens：落地页与下钻页严格遵守产品壳布局规则', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '产品壳视觉规则只需在标准桌面宽度执行一次。');
  const drilldown = await page.evaluate(() => {
    const content = document.querySelector<HTMLElement>('.sens-product-shell__content');
    const title = document.querySelector<HTMLElement>('.calendar-title-bar--drilldown');
    const body = document.querySelector<HTMLElement>('.trading-calendar-shell');
    const scroll = document.querySelector<HTMLElement>('.product-shell-scroll--drilldown');
    return {
      layout: document.querySelector<HTMLElement>('.sens-product-shell')?.dataset.sensProductShellLayout,
      sideNavigationCount: document.querySelectorAll('.sens-product-shell-side-navigation').length,
      topLeftRadius: content ? getComputedStyle(content).borderTopLeftRadius : null,
      topRightRadius: content ? getComputedStyle(content).borderTopRightRadius : null,
      titleBackground: title ? getComputedStyle(title).backgroundColor : null,
      bodyBackground: body ? getComputedStyle(body).backgroundColor : null,
      scrollBackground: scroll ? getComputedStyle(scroll).backgroundColor : null,
      bodyPaddingTop: body ? getComputedStyle(body).paddingTop : null,
      bodyHeight: body?.getBoundingClientRect().height ?? 0,
      scrollHeight: scroll?.getBoundingClientRect().height ?? 0,
    };
  });
  expect(drilldown.layout).toBe('vertical');
  expect(drilldown.sideNavigationCount).toBe(0);
  expect(drilldown.topLeftRadius).toBe('10px');
  expect(drilldown.topRightRadius).toBe('10px');
  expect(drilldown.bodyPaddingTop).toBe('16px');
  expect(drilldown.bodyBackground).toBe(drilldown.scrollBackground);
  expect(drilldown.titleBackground).not.toBe(drilldown.bodyBackground);
  expect(drilldown.bodyHeight).toBeGreaterThanOrEqual(drilldown.scrollHeight);

  await page.getByRole('button', { name: '返回', exact: true }).click();
  const landing = await page.evaluate(() => {
    const content = document.querySelector<HTMLElement>('.sens-product-shell__content');
    const side = document.querySelector<HTMLElement>('.product-shell-side-container');
    const body = document.querySelector<HTMLElement>('.basic-settings-shell');
    const scroll = document.querySelector<HTMLElement>('.product-shell-scroll--landing');
    return {
      layout: document.querySelector<HTMLElement>('.sens-product-shell')?.dataset.sensProductShellLayout,
      sideNavigationCount: document.querySelectorAll('.sens-product-shell-side-navigation').length,
      sideTopLeftRadius: side ? getComputedStyle(side).borderTopLeftRadius : null,
      contentTopRightRadius: content ? getComputedStyle(content).borderTopRightRadius : null,
      bodyPaddingTop: body ? getComputedStyle(body).paddingTop : null,
      bodyBackground: body ? getComputedStyle(body).backgroundColor : null,
      scrollBackground: scroll ? getComputedStyle(scroll).backgroundColor : null,
      bodyHeight: body?.getBoundingClientRect().height ?? 0,
      sectionTitleCount: document.querySelectorAll('.sens-section-title').length,
      entryCardCount: document.querySelectorAll('.sens-entry-card').length,
      gridColumns: document.querySelector('.entry-card-grid') ? getComputedStyle(document.querySelector<HTMLElement>('.entry-card-grid')!).gridTemplateColumns.split(' ').length : 0,
    };
  });
  expect(landing.layout).toBe('t');
  expect(landing.sideNavigationCount).toBe(1);
  expect(landing.sideTopLeftRadius).toBe('10px');
  expect(landing.contentTopRightRadius).toBe('10px');
  expect(landing.bodyPaddingTop).toBe('0px');
  expect(landing.bodyBackground).toBe(landing.scrollBackground);
  expect(landing.bodyHeight).toBeGreaterThan(0);
  expect(landing.sectionTitleCount).toBe(2);
  expect(landing.entryCardCount).toBe(9);
  expect(landing.gridColumns).toBe(4);
});

test('Sens：入口设置样板在三档宽度使用正式组件和规定列数', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: '返回', exact: true }).click();
  const landing = await page.evaluate(() => {
    const grid = document.querySelector<HTMLElement>('.entry-card-grid');
    const cards = [...document.querySelectorAll<HTMLElement>('.sens-entry-card')];
    return {
      sectionTitleCount: document.querySelectorAll('.sens-section-title').length,
      entryCardCount: cards.length,
      gridColumns: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0,
      tallestCard: Math.max(...cards.map((card) => card.getBoundingClientRect().height)),
    };
  });
  expect(landing.sectionTitleCount).toBe(2);
  expect(landing.entryCardCount).toBe(9);
  expect(landing.gridColumns).toBe(testInfo.project.name === 'desktop-1280' ? 3 : 4);
  expect(landing.tallestCard).toBeLessThan(120);
});

test('视觉与交付：三档桌面宽度保持 24px 页面留白且无运行时错误', async ({ page }) => {
  const runtimeErrors = watchRuntime(page);
  const layout = await page.evaluate(() => {
    const pageElement = document.querySelector<HTMLElement>('.trading-calendar-shell');
    const grid = document.querySelector<HTMLElement>('.month-grid');
    return {
      paddingLeft: pageElement ? getComputedStyle(pageElement).paddingLeft : null,
      paddingRight: pageElement ? getComputedStyle(pageElement).paddingRight : null,
      gridWidth: grid?.getBoundingClientRect().width ?? 0,
      pageWidth: pageElement?.getBoundingClientRect().width ?? 0,
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  expect(layout.paddingLeft).toBe('24px');
  expect(layout.paddingRight).toBe('24px');
  expect(layout.gridWidth).toBeGreaterThan(0);
  expect(layout.gridWidth).toBeLessThanOrEqual(layout.pageWidth);
  expect(runtimeErrors).toEqual([]);
});

test('Sens：交易日、非交易日和今天使用不同的语义状态', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'Token 状态只需执行一次。');
  const styles = await page.evaluate(() => {
    const trading = document.querySelector<HTMLElement>('.calendar-status--trading .calendar-status__dot');
    const closed = document.querySelector<HTMLElement>('.calendar-status--closed .calendar-status__dot');
    const today = document.querySelector<HTMLElement>('.calendar-cell--today');
    return {
      trading: trading ? getComputedStyle(trading).backgroundColor : null,
      closed: closed ? getComputedStyle(closed).backgroundColor : null,
      today: today ? getComputedStyle(today).backgroundColor : null,
      regular: document.querySelector<HTMLElement>('.calendar-cell:not(.calendar-cell--today)') ? getComputedStyle(document.querySelector<HTMLElement>('.calendar-cell:not(.calendar-cell--today)')!).backgroundColor : null,
    };
  });
  expect(styles.trading).not.toBe(styles.closed);
  expect(styles.today).not.toBe(styles.regular);
});

test('P1 视觉：月视图层级、密度和日期状态在三档宽度保持一致', async ({ page }) => {
  const visual = await page.evaluate(() => {
    const toolbar = document.querySelector<HTMLElement>('[data-testid="calendar-toolbar"]');
    const meta = document.querySelector<HTMLElement>('[data-testid="calendar-meta"]');
    const cells = [...document.querySelectorAll<HTMLElement>('.calendar-cell')];
    const today = document.querySelector<HTMLElement>('.calendar-cell--today');
    const todayDate = today?.querySelector<HTMLElement>('.calendar-cell__date');
    const normalDate = document.querySelector<HTMLElement>('.calendar-cell:not(.calendar-cell--today):not(.calendar-cell--adjacent) .calendar-cell__date');
    const adjacent = document.querySelector<HTMLElement>('.calendar-cell--adjacent');
    const tradingDot = document.querySelector<HTMLElement>('.calendar-status--trading .calendar-status__dot');
    const closedDot = document.querySelector<HTMLElement>('.calendar-status--closed .calendar-status__dot');
    return {
      toolbarHeight: toolbar?.getBoundingClientRect().height ?? 0,
      metaHeight: meta?.getBoundingClientRect().height ?? 0,
      weekdayCount: document.querySelectorAll('.weekday').length,
      cellCount: cells.length,
      minCellHeight: Math.min(...cells.map((cell) => cell.getBoundingClientRect().height)),
      maxCellHeight: Math.max(...cells.map((cell) => cell.getBoundingClientRect().height)),
      todayCurrent: today?.getAttribute('aria-current'),
      todayDateWidth: todayDate?.getBoundingClientRect().width ?? 0,
      normalDateWidth: normalDate?.getBoundingClientRect().width ?? 0,
      todayBackground: today ? getComputedStyle(today).backgroundColor : null,
      adjacentColor: adjacent ? getComputedStyle(adjacent).color : null,
      normalColor: normalDate ? getComputedStyle(normalDate).color : null,
      tradingDot: tradingDot ? getComputedStyle(tradingDot).backgroundColor : null,
      closedDot: closedDot ? getComputedStyle(closedDot).backgroundColor : null,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
  expect(visual.toolbarHeight).toBe(64);
  expect(visual.metaHeight).toBeGreaterThanOrEqual(40);
  expect(visual.weekdayCount).toBe(7);
  expect(visual.cellCount).toBe(35);
  expect(visual.minCellHeight).toBeGreaterThanOrEqual(112);
  expect(visual.maxCellHeight).toBe(visual.minCellHeight);
  expect(visual.todayCurrent).toBe('date');
  expect(visual.todayDateWidth).toBeGreaterThan(visual.normalDateWidth);
  expect(visual.todayBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(visual.adjacentColor).not.toBe(visual.normalColor);
  expect(visual.tradingDot).not.toBe(visual.closedDot);
  expect(visual.documentWidth).toBeLessThanOrEqual(visual.viewportWidth);
});

test('P1 视觉：年视图保持十二个月和四列信息结构', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '年视图结构只需在标准桌面宽度执行一次。');
  await page.getByRole('tab', { name: '年视图', exact: true }).click();
  const year = await page.evaluate(() => {
    const grid = document.querySelector<HTMLElement>('[data-testid="year-calendar"]');
    return {
      monthCount: document.querySelectorAll('.mini-month').length,
      columns: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0,
    };
  });
  expect(year.monthCount).toBe(12);
  expect(year.columns).toBe(4);
});

test('P1-2 视觉：小中抽屉在三档宽度遵守正式尺寸和内容内边距', async ({ page }, testInfo) => {
  const expectedSmallWidth = testInfo.project.name === 'desktop-1920' ? 576 : 432;
  const expectedMediumWidth = testInfo.project.name === 'desktop-1920' ? 1152 : 864;

  await page.getByRole('button', { name: /2026-09-17，非交易日/ }).click();
  await expect(page.getByTestId('single-edit-drawer')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: '返回', exact: true })).toBeVisible();
  const small = await page.evaluate(() => {
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const content = document.querySelector<HTMLElement>('[data-testid="single-edit-drawer"]');
    const titleBar = dialog?.firstElementChild as HTMLElement | null;
    const body = content?.parentElement as HTMLElement | null;
    const dialogRect = dialog?.getBoundingClientRect();
    const titleRect = titleBar?.getBoundingClientRect();
    const contentRect = content?.getBoundingClientRect();
    const bodyStyle = body ? getComputedStyle(body) : null;
    const contentStyle = content ? getComputedStyle(content) : null;
    return {
      width: dialogRect?.width ?? 0,
      bodyPaddingTop: bodyStyle?.paddingTop,
      bodyPaddingRight: bodyStyle?.paddingRight,
      bodyPaddingBottom: bodyStyle?.paddingBottom,
      bodyPaddingLeft: bodyStyle?.paddingLeft,
      contentPaddingTop: contentStyle?.paddingTop,
      effectiveTop: contentRect && titleRect ? contentRect.top - titleRect.bottom : 0,
      effectiveLeft: contentRect && dialogRect ? contentRect.left - dialogRect.left : 0,
      effectiveRight: contentRect && dialogRect ? dialogRect.right - contentRect.right : 0,
    };
  });
  expect(small.width).toBeCloseTo(expectedSmallWidth, 1);
  expect(small).toMatchObject({ bodyPaddingTop: '16px', bodyPaddingRight: '24px', bodyPaddingBottom: '24px', bodyPaddingLeft: '24px', contentPaddingTop: '0px' });
  expect(small.effectiveTop).toBe(16);
  expect(small.effectiveLeft).toBe(24);
  expect(small.effectiveRight).toBe(24);
  await page.getByRole('dialog').getByRole('button', { name: '返回', exact: true }).click();
  await expect(page.getByTestId('single-edit-drawer')).toBeHidden();

  await page.getByRole('button', { name: /编\s*辑/ }).click();
  await expect(page.getByTestId('batch-edit-drawer')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: '返回', exact: true })).toBeVisible();
  const medium = await page.evaluate(() => {
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const content = document.querySelector<HTMLElement>('[data-testid="batch-edit-drawer"]');
    const titleBar = dialog?.firstElementChild as HTMLElement | null;
    const body = content?.parentElement as HTMLElement | null;
    const dialogRect = dialog?.getBoundingClientRect();
    const titleRect = titleBar?.getBoundingClientRect();
    const contentRect = content?.getBoundingClientRect();
    const bodyStyle = body ? getComputedStyle(body) : null;
    const contentStyle = content ? getComputedStyle(content) : null;
    return {
      width: dialogRect?.width ?? 0,
      bodyPaddingTop: bodyStyle?.paddingTop,
      bodyPaddingRight: bodyStyle?.paddingRight,
      bodyPaddingBottom: bodyStyle?.paddingBottom,
      bodyPaddingLeft: bodyStyle?.paddingLeft,
      contentPaddingTop: contentStyle?.paddingTop,
      effectiveTop: contentRect && titleRect ? contentRect.top - titleRect.bottom : 0,
      effectiveLeft: contentRect && dialogRect ? contentRect.left - dialogRect.left : 0,
      effectiveRight: contentRect && dialogRect ? dialogRect.right - contentRect.right : 0,
    };
  });
  expect(medium.width).toBeCloseTo(expectedMediumWidth, 1);
  expect(medium).toMatchObject({ bodyPaddingTop: '16px', bodyPaddingRight: '24px', bodyPaddingBottom: '24px', bodyPaddingLeft: '24px', contentPaddingTop: '0px' });
  expect(medium.effectiveTop).toBe(16);
  expect(medium.effectiveLeft).toBe(24);
  expect(medium.effectiveRight).toBe(24);
});

test('P1-2 视觉：上传与通知抽屉使用正确标题层级、状态反馈和分组节奏', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '抽屉内部层级只需在标准桌面宽度执行一次。');

  await page.getByRole('button', { name: /批量上传/ }).click();
  await expect(page.getByTestId('upload-drawer')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: '返回', exact: true })).toBeVisible();
  const upload = await page.evaluate(() => {
    const drawer = document.querySelector<HTMLElement>('[data-testid="upload-drawer"]');
    const alert = drawer?.querySelector<HTMLElement>('[role="alert"]') ?? null;
    const alertText = alert?.querySelectorAll<HTMLElement>(':scope > div > span') ?? [];
    const alertStyle = alert ? getComputedStyle(alert) : null;
    const alertIcon = alert?.querySelector<SVGElement>('svg') ?? null;
    const guide = document.querySelector<HTMLElement>('[data-testid="upload-drawer"] .upload-guide');
    const title = document.querySelector<HTMLElement>('[data-testid="upload-drawer"] .drawer-section-title');
    const helper = document.querySelector<HTMLElement>('[data-testid="upload-drawer"] .upload-guide p');
    const feedback = document.querySelector<HTMLElement>('[data-testid="upload-drawer"] .upload-result__message');
    return {
      alertCount: drawer?.querySelectorAll('[role="alert"]').length ?? 0,
      legacyBannerCount: drawer?.querySelectorAll('.notice-banner').length ?? 0,
      alertHeight: alert?.getBoundingClientRect().height ?? 0,
      alertWidth: alert?.getBoundingClientRect().width ?? 0,
      drawerWidth: drawer?.getBoundingClientRect().width ?? 0,
      alertPaddingTop: alertStyle?.paddingTop,
      alertPaddingRight: alertStyle?.paddingRight,
      alertPaddingBottom: alertStyle?.paddingBottom,
      alertPaddingLeft: alertStyle?.paddingLeft,
      alertBackground: alertStyle?.backgroundColor,
      alertBorderColor: alertStyle?.borderTopColor,
      alertBorderWidth: alertStyle?.borderTopWidth,
      alertRadius: alertStyle?.borderRadius,
      alertTitleSize: alertText[0] ? getComputedStyle(alertText[0]).fontSize : null,
      alertTitleLineHeight: alertText[0] ? getComputedStyle(alertText[0]).lineHeight : null,
      alertDescriptionSize: alertText[1] ? getComputedStyle(alertText[1]).fontSize : null,
      alertDescriptionLineHeight: alertText[1] ? getComputedStyle(alertText[1]).lineHeight : null,
      alertIconSize: alertIcon?.getBoundingClientRect().width ?? 0,
      titleSize: title ? getComputedStyle(title).fontSize : null,
      titleLineHeight: title ? getComputedStyle(title).lineHeight : null,
      helperSize: helper ? getComputedStyle(helper).fontSize : null,
      helperLineHeight: helper ? getComputedStyle(helper).lineHeight : null,
      alertGap: alert && guide ? guide.getBoundingClientRect().top - alert.getBoundingClientRect().bottom : 0,
      feedbackIconCount: feedback?.querySelectorAll('[aria-hidden="true"]').length ?? 0,
    };
  });
  expect(upload.alertCount).toBe(1);
  expect(upload.legacyBannerCount).toBe(0);
  expect(upload.alertHeight).toBeGreaterThanOrEqual(58);
  expect(upload.alertWidth).toBeCloseTo(upload.drawerWidth, 1);
  expect(upload.alertPaddingTop).toBe('7px');
  expect(upload.alertPaddingRight).toBe('12px');
  expect(upload.alertPaddingBottom).toBe('7px');
  expect(upload.alertPaddingLeft).toBe('12px');
  expect(upload.alertBackground).toBe('rgb(255, 248, 229)');
  expect(upload.alertBorderColor).toBe('rgb(255, 227, 153)');
  expect(upload.alertBorderWidth).toBe('1px');
  expect(upload.alertRadius).toBe('4px');
  expect(upload.alertTitleSize).toBe('14px');
  expect(upload.alertTitleLineHeight).toBe('22px');
  expect(upload.alertDescriptionSize).toBe('12px');
  expect(upload.alertDescriptionLineHeight).toBe('18px');
  expect(upload.alertIconSize).toBe(16);
  expect(upload.titleSize).toBe('14px');
  expect(upload.titleLineHeight).toBe('22px');
  expect(upload.helperSize).toBe('12px');
  expect(upload.helperLineHeight).toBe('18px');
  expect(upload.alertGap).toBe(16);
  expect(upload.feedbackIconCount).toBe(1);
  await page.getByRole('dialog').getByRole('button', { name: '返回', exact: true }).click();

  await page.getByRole('button', { name: '通知配置', exact: true }).click();
  await expect(page.getByTestId('notification-drawer')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: '返回', exact: true })).toBeVisible();
  const summary = await page.evaluate(() => {
    const drawer = document.querySelector<HTMLElement>('[data-testid="notification-drawer"]');
    const alert = drawer?.querySelector<HTMLElement>('[role="alert"]') ?? null;
    const alertText = alert?.querySelector<HTMLElement>(':scope > div > span:first-child') ?? null;
    const alertIcon = alert?.querySelector<SVGElement>('svg') ?? null;
    const alertStyle = alert ? getComputedStyle(alert) : null;
    const root = document.querySelector<HTMLElement>('.notification-summary');
    const titles = [...document.querySelectorAll<HTMLElement>('.notification-summary .drawer-section-title')];
    const labels = [...document.querySelectorAll<HTMLElement>('.notification-summary dt')];
    const values = [...document.querySelectorAll<HTMLElement>('.notification-summary dd')];
    const helper = document.querySelector<HTMLElement>('.notification-summary p');
    const colorChannels = (color: string | null) => color?.match(/[\d.]+/g)?.slice(0, 3) ?? [];
    return {
      alertCount: drawer?.querySelectorAll('[role="alert"]').length ?? 0,
      legacyBannerCount: drawer?.querySelectorAll('.notice-banner').length ?? 0,
      alertHeight: alert?.getBoundingClientRect().height ?? 0,
      alertWidth: alert?.getBoundingClientRect().width ?? 0,
      drawerWidth: drawer?.getBoundingClientRect().width ?? 0,
      alertPaddingLeft: alertStyle?.paddingLeft,
      alertPaddingRight: alertStyle?.paddingRight,
      alertBorderWidth: alertStyle?.borderTopWidth,
      alertBorderStyle: alertStyle?.borderTopStyle,
      alertRadius: alertStyle?.borderRadius,
      alertTextSize: alertText ? getComputedStyle(alertText).fontSize : null,
      alertTextLineHeight: alertText ? getComputedStyle(alertText).lineHeight : null,
      alertTextColor: alertText ? getComputedStyle(alertText).color : null,
      alertTextRgb: colorChannels(alertText ? getComputedStyle(alertText).color : null),
      alertIconSize: alertIcon?.getBoundingClientRect().width ?? 0,
      sectionGap: root ? getComputedStyle(root).rowGap : null,
      titleSizes: titles.map((title) => getComputedStyle(title).fontSize),
      titleLineHeights: titles.map((title) => getComputedStyle(title).lineHeight),
      labelTexts: labels.map((item) => item.textContent),
      labelSizes: labels.map((item) => getComputedStyle(item).fontSize),
      valueSizes: values.map((item) => getComputedStyle(item).fontSize),
      primaryColor: values[0] ? getComputedStyle(values[0]).color : null,
      primaryRgb: colorChannels(values[0] ? getComputedStyle(values[0]).color : null),
      helperColor: helper ? getComputedStyle(helper).color : null,
    };
  });
  expect(summary.alertCount).toBe(1);
  expect(summary.legacyBannerCount).toBe(0);
  expect(summary.alertHeight).toBe(36);
  expect(summary.alertWidth).toBeCloseTo(summary.drawerWidth, 1);
  expect(summary.alertPaddingLeft).toBe('12px');
  expect(summary.alertPaddingRight).toBe('12px');
  expect(summary.alertBorderWidth).toBe('1px');
  expect(summary.alertBorderStyle).toBe('solid');
  expect(summary.alertRadius).toBe('4px');
  expect(summary.alertTextSize).toBe('14px');
  expect(summary.alertTextLineHeight).toBe('22px');
  expect(summary.alertIconSize).toBe(16);
  expect(summary.sectionGap).toBe('40px');
  expect(summary.titleSizes).toEqual(['14px', '14px']);
  expect(summary.titleLineHeights).toEqual(['22px', '22px']);
  expect(summary.labelTexts).toEqual(['通知方式', '指定对象']);
  expect(summary.labelSizes).toEqual(['14px', '14px']);
  expect(summary.valueSizes).toEqual(['14px', '14px']);
  expect(summary.alertTextColor).not.toBeNull();
  expect(summary.alertTextRgb).toEqual(summary.primaryRgb);
  expect(summary.helperColor).not.toBe(summary.primaryColor);
  const notificationDrawer = page.getByLabel('通知配置');
  await notificationDrawer.getByRole('button', { name: /编\s*辑/ }).click();
  await expect(page.locator('.sens-checkbox-group')).toHaveCount(1);
  await expect(page.locator('.notification-form')).toHaveCSS('row-gap', '40px');
});

test('P1-2 视觉：历史日期二次确认锚定保存按钮且使用小按钮', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '确认浮层只需在标准桌面宽度执行一次。');
  await page.getByRole('button', { name: /2026-09-17，非交易日/ }).click();
  const drawer = page.getByTestId('single-edit-drawer');
  await drawer.getByText('交易日', { exact: true }).last().click();
  const save = page.getByRole('button', { name: /保\s*存/ });
  await save.click();
  await expect(page.getByText('确认修改交易日状态？', { exact: true })).toBeVisible();
  const placement = await page.evaluate(() => {
    const popover = document.querySelector<HTMLElement>('.sens-popover');
    const trigger = document.querySelector<HTMLElement>('.sens-popover-trigger');
    const actions = [...document.querySelectorAll<HTMLElement>('.sens-popover__actions button')];
    const popoverRect = popover?.getBoundingClientRect();
    const triggerRect = trigger?.getBoundingClientRect();
    return {
      containsTriggerCenter: Boolean(popoverRect && triggerRect && triggerRect.left + triggerRect.width / 2 >= popoverRect.left && triggerRect.left + triggerRect.width / 2 <= popoverRect.right),
      actionHeights: actions.map((button) => button.getBoundingClientRect().height),
    };
  });
  expect(placement.containsTriggerCenter).toBe(true);
  expect(placement.actionHeights).toHaveLength(2);
  expect(Math.max(...placement.actionHeights)).toBeLessThanOrEqual(24);
});
