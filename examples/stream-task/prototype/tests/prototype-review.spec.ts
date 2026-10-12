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

async function choose(page: Page, placeholder: string, option: string) {
  await page.getByText(placeholder, { exact: true }).first().locator('..').getByRole('combobox').click();
  await page.getByText(option, { exact: true }).last().click();
}

async function fillBasicSource(page: Page, standardJson = false) {
  await page.getByPlaceholder('请输入', { exact: true }).first().fill(standardJson ? '标准JSON流任务' : '订单同步流任务');
  await choose(page, '请选择来源连接', 'Kafka / 一个 Kafka 数据源连接名称');
  await choose(page, '请选择来源侧数据', standardJson ? 'sensors_standard_json' : 'pair_coupon/we_user');
  await choose(page, '请选择 Schema', standardJson ? '神策标准 JSON 格式' : 'pair_coupon/we_user');
  if (!standardJson) await choose(page, '请选择目标侧数据', '用户实体（user）/ 标签');
}

async function fillFieldMapping(page: Page) {
  await choose(page, '请选择用户标识字段', 'user id');
  await choose(page, '请选择用户标识字段', '用户 ID');
  await choose(page, '请选择标签值字段', 'event');
  await choose(page, '请选择标签值字段', '事件名');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('stream-task-list')).toBeVisible();
});

test('Sens：侧导航默认展开，收起后内容区自适应', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '产品壳宽度关系只需在标准桌面宽度执行一次。');
  const navigation = page.locator('.sens-product-shell-side-navigation');
  const content = page.locator('.sens-product-shell__content');
  const buriedGroup = navigation.getByRole('button', { name: '埋点数据接入', exact: true });
  const expandedNavigation = await navigation.boundingBox();
  const expandedContent = await content.boundingBox();

  expect(expandedNavigation?.width).toBe(220);
  expect(expandedContent?.x).toBe(220);
  await expect(buriedGroup).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation.getByRole('button', { name: '数据接入引导', exact: true })).toBeVisible();
  await buriedGroup.click();
  await expect(buriedGroup).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation.getByRole('button', { name: '数据接入引导', exact: true })).toHaveCount(0);
  await buriedGroup.click();
  await expect(buriedGroup).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation.getByRole('button', { name: '数据接入引导', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '收起侧边导航', exact: true }).click();

  const collapsedNavigation = await navigation.boundingBox();
  const collapsedContent = await content.boundingBox();
  expect(collapsedNavigation?.width).toBe(56);
  expect(collapsedContent?.x).toBe(56);
  expect(collapsedContent?.width).toBe((expandedContent?.width ?? 0) + 164);
  await expect(page.getByRole('button', { name: '展开侧边导航', exact: true })).toBeVisible();
});

test('Sens：执行规则与报警条件消费主要正文色', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '文字 token 只需在标准桌面宽度执行一次。');
  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await fillBasicSource(page);

  const textStyles = await page.evaluate(() => {
    const label = document.querySelector<HTMLElement>('.read-row > span');
    const value = document.querySelector<HTMLElement>('.read-row > strong');
    const alarmCondition = document.querySelector<HTMLElement>('.alarm-condition');
    return {
      labelColor: label ? getComputedStyle(label).color : null,
      valueColor: value ? getComputedStyle(value).color : null,
      valueFontSize: value ? getComputedStyle(value).fontSize : null,
      alarmColor: alarmCondition ? getComputedStyle(alarmCondition).color : null,
      alarmFontSize: alarmCondition ? getComputedStyle(alarmCondition).fontSize : null,
    };
  });

  expect(textStyles.valueColor).toBe(textStyles.labelColor);
  expect(textStyles.alarmColor).toBe(textStyles.labelColor);
  expect(textStyles.valueFontSize).toBe('14px');
  expect(textStyles.alarmFontSize).toBe('14px');
});

test('Sens：列表筛选和任务状态消费正式规格', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '列表筛选和状态 token 只需在标准桌面宽度执行一次。');
  const styles = await page.evaluate(() => {
    const statusColor = (name: string) => {
      const row = [...document.querySelectorAll<HTMLElement>('.task-status')]
        .find((element) => element.textContent?.trim().startsWith(name));
      const dot = row?.querySelector<HTMLElement>('.task-status__dot');
      return dot ? getComputedStyle(dot).backgroundColor : null;
    };
    const search = document.querySelector<HTMLElement>('.list-toolbar .sens-search-field');
    const selectPlaceholder = document.querySelector<HTMLElement>('.list-toolbar .ant-select-selection-placeholder');
    return {
      searchWidth: search?.getBoundingClientRect().width ?? 0,
      selectFontSize: selectPlaceholder ? getComputedStyle(selectPlaceholder).fontSize : null,
      selectLineHeight: selectPlaceholder ? getComputedStyle(selectPlaceholder).lineHeight : null,
      waiting: statusColor('等待运行'),
      running: statusColor('运行中'),
      abnormal: statusColor('运行中 · 异常'),
      paused: statusColor('已暂停'),
    };
  });

  expect(styles.searchWidth).toBe(200);
  expect(styles.selectFontSize).toBe('14px');
  expect(styles.selectLineHeight).toBe('22px');
  expect(styles.waiting).toBe('rgb(49, 112, 235)');
  expect(styles.running).toBe('rgb(92, 184, 56)');
  expect(styles.abnormal).toBe('rgb(229, 69, 69)');
  expect(styles.paused).toBe('rgb(179, 183, 190)');
});

test('Sens：窄于 1280px 时保留桌面最小宽度、24px 页面留白和右侧锚点', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '窄屏桌面规则只需执行一次。');
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.reload();

  const listLayout = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('.sens-product-shell');
    const list = document.querySelector<HTMLElement>('.list-page');
    return {
      shellWidth: shell?.getBoundingClientRect().width ?? 0,
      documentWidth: document.documentElement.scrollWidth,
      paddingLeft: list ? getComputedStyle(list).paddingLeft : null,
      paddingRight: list ? getComputedStyle(list).paddingRight : null,
    };
  });
  expect(listLayout.shellWidth).toBe(1280);
  expect(listLayout.documentWidth).toBeGreaterThanOrEqual(1280);
  expect(listLayout.paddingLeft).toBe('24px');
  expect(listLayout.paddingRight).toBe('24px');

  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  const formLayout = await page.evaluate(() => {
    const form = document.querySelector<HTMLElement>('.task-form-page');
    const anchors = document.querySelector<HTMLElement>('.form-anchors');
    const anchor = document.querySelector<HTMLElement>('.form-anchors button');
    return {
      paddingLeft: form ? getComputedStyle(form).paddingLeft : null,
      paddingRight: form ? getComputedStyle(form).paddingRight : null,
      formRight: form?.getBoundingClientRect().right ?? 0,
      anchorsRight: anchors?.getBoundingClientRect().right ?? 0,
      anchorFontSize: anchor ? getComputedStyle(anchor).fontSize : null,
      anchorLineHeight: anchor ? getComputedStyle(anchor).lineHeight : null,
    };
  });
  expect(formLayout.paddingLeft).toBe('24px');
  expect(formLayout.paddingRight).toBe('24px');
  expect(formLayout.anchorsRight).toBeLessThanOrEqual(formLayout.formRight - 24);
  expect(formLayout.anchorFontSize).toBe('14px');
  expect(formLayout.anchorLineHeight).toBe('22px');
});

test('Sens：操作列最多显示两个操作和更多，删除收进菜单', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '操作列组合只需执行一次。');
  const actionCell = page.getByRole('row').filter({ hasText: '订单实时同步' }).getByRole('cell').last();
  await expect(actionCell.getByRole('button', { name: '查看任务', exact: true })).toBeVisible();
  await expect(actionCell.getByRole('button', { name: '运行', exact: true })).toBeVisible();
  await expect(actionCell.getByRole('button', { name: '更多', exact: true })).toBeVisible();
  await expect(actionCell.getByRole('button', { name: '删除', exact: true })).toHaveCount(0);

  const moreButton = actionCell.getByRole('button', { name: '更多', exact: true });
  await moreButton.click();
  await expect(page.getByRole('menuitem', { name: '编辑', exact: true })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: '复制', exact: true })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: '删除', exact: true })).toBeVisible();
  await page.getByRole('menuitem', { name: '删除', exact: true }).click();
  await expect(page.getByText('确认要删除该任务吗？', { exact: true })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: '删除', exact: true })).toBeHidden();
  await expect(page.locator('.sens-dropdown-menu-overlay')).toBeHidden();
  const popoverTarget = await page.evaluate(() => {
    const button = document.querySelector<HTMLElement>('.task-actions[data-task-id="238"] .sens-dropdown-btn');
    const trigger = document.querySelector<HTMLElement>('.task-actions[data-task-id="238"] .delete-confirm-positioner .sens-popover-trigger');
    const arrow = document.querySelector<HTMLElement>('.sens-popover__arrow');
    const rect = (element: HTMLElement | null) => element?.getBoundingClientRect() ?? null;
    return { button: rect(button), trigger: rect(trigger), arrow: rect(arrow) };
  });
  expect(popoverTarget.button).not.toBeNull();
  expect(popoverTarget.trigger).not.toBeNull();
  expect(popoverTarget.arrow).not.toBeNull();
  expect(Math.abs((popoverTarget.button?.x ?? 0) - (popoverTarget.trigger?.x ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((popoverTarget.button?.width ?? 0) - (popoverTarget.trigger?.width ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs(
    ((popoverTarget.button?.y ?? 0) + (popoverTarget.button?.height ?? 0) / 2)
    - ((popoverTarget.arrow?.y ?? 0) + (popoverTarget.arrow?.height ?? 0) / 2),
  )).toBeLessThanOrEqual(2);
  for (const name of [/确\s*定/, /取\s*消/]) {
    const button = page.getByRole('button', { name });
    await expect(button).toHaveCSS('height', '24px');
    await expect(button).toHaveCSS('font-size', '12px');
  }
  await page.getByRole('button', { name: /取\s*消/ }).click();
  await expect(page.getByText('确认要删除该任务吗？', { exact: true })).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: '订单实时同步' })).toBeVisible();
  await expect(moreButton).toBeFocused();
});

test('交互：非核心静默入口明确禁用', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '非核心入口只需在标准桌面宽度执行一次。');
  await expect(page.getByRole('button', { name: 'Schema 配置', exact: true })).toBeDisabled();

  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Schema 管理', exact: true })).toBeDisabled();
  await choose(page, '请选择来源连接', 'HDFS / 一个异常的连接名称');
  await expect(page.getByRole('button', { name: '查看详情', exact: true })).toBeDisabled();

  await page.reload();
  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await fillBasicSource(page);
  await expect(page.getByRole('button', { name: '批量操作', exact: true })).toBeDisabled();
});

test('Sens：更多箭头与文字、Hash 字段内容保持同一中心线', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '局部对齐只需在标准桌面宽度执行一次。');
  const moreAlignment = await page.locator('.task-actions .sens-dropdown-btn').first().evaluate((button) => {
    const label = button.querySelector<HTMLElement>(':scope > span:last-child');
    const icon = button.querySelector<HTMLElement>('.sens-dropdown-btn-icon svg');
    const centerY = (element: Element | null) => {
      const rect = element?.getBoundingClientRect();
      return rect ? rect.top + rect.height / 2 : null;
    };
    return { label: centerY(label), icon: centerY(icon) };
  });
  expect(moreAlignment.label).not.toBeNull();
  expect(moreAlignment.icon).not.toBeNull();
  expect(Math.abs((moreAlignment.label ?? 0) - (moreAlignment.icon ?? 0))).toBeLessThanOrEqual(1);

  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await fillBasicSource(page);
  const hashCenters = await page.locator('.hash-field-box').evaluate((box) => {
    const elements = [
      box.querySelector(':scope > span'),
      box.querySelector('.hash-chip'),
      box.querySelector('.hash-chips > button'),
    ];
    return elements.map((element) => {
      const rect = element?.getBoundingClientRect();
      return rect ? rect.top + rect.height / 2 : null;
    });
  });
  expect(hashCenters.every((center) => center !== null)).toBe(true);
  expect(Math.max(...hashCenters.map((center) => center ?? 0)) - Math.min(...hashCenters.map((center) => center ?? 0))).toBeLessThanOrEqual(1);
});

test('Sens：列表 Tab 使用 40px 行高并让分割线贯穿标题和右侧操作区', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'Tab 样板只需在标准桌面宽度执行一次。');
  const divider = await page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>('.page-heading');
    const tabs = document.querySelector<HTMLElement>('.task-tabs');
    const actions = document.querySelector<HTMLElement>('.page-heading__actions');
    const headingRect = heading?.getBoundingClientRect();
    const actionsRect = actions?.getBoundingClientRect();
    const firstTab = tabs?.querySelector<HTMLElement>('button');
    return {
      headingBorder: heading ? getComputedStyle(heading).borderBottomWidth : null,
      tabsBorder: tabs ? getComputedStyle(tabs).borderBottomWidth : null,
      headingHeight: headingRect?.height ?? 0,
      tabsHeight: tabs?.getBoundingClientRect().height ?? 0,
      tabFontSize: firstTab ? getComputedStyle(firstTab).fontSize : null,
      tabLineHeight: firstTab ? getComputedStyle(firstTab).lineHeight : null,
      headingLeft: headingRect?.left ?? 0,
      headingRight: headingRect?.right ?? 0,
      actionsRight: actionsRect?.right ?? 0,
    };
  });
  expect(divider.headingBorder).toBe('1px');
  expect(divider.tabsBorder).toBe('0px');
  expect(divider.tabsHeight).toBe(40);
  expect(divider.headingHeight).toBe(divider.tabsHeight + 1);
  expect(divider.tabFontSize).toBe('14px');
  expect(divider.tabLineHeight).toBe('22px');
  expect(divider.headingRight).toBeGreaterThanOrEqual(divider.actionsRight);
  expect(divider.headingRight - divider.headingLeft).toBeGreaterThan(1000);
});

test('需求：创建页初始依赖态和空表单返回符合流程', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '初始依赖态只需运行一次。');
  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await expect(page.getByText('字段映射', { exact: true })).toHaveCount(0);
  await expect(page.getByText('暂无数据', { exact: true })).toBeVisible();
  await expect(page.getByText('请先选择数据来源和目标', { exact: true })).toBeVisible();
  await expect(page.getByText('并行度', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: /放\s*弃/ }).click();
  await expect(page.getByText('确定放弃当前编辑吗？', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('stream-task-list')).toBeVisible();
});

test('需求：非标准数据必须完成字段映射并在详情准确回显', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '字段映射门禁只需运行一次。');
  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await fillBasicSource(page);
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByText('请选择来源侧用户标识字段', { exact: true })).toBeVisible();
  await expect(page.getByText('请填写完整的标签值字段映射', { exact: true })).toBeVisible();
  await expect(page.getByTestId('create-task-form')).toBeVisible();

  await fillFieldMapping(page);
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByTestId('task-detail')).toBeVisible();
  await expect(page.getByLabel('来源侧用户标识字段')).toHaveValue('user id');
  await expect(page.getByLabel('目标侧用户标识字段')).toHaveValue('用户 ID');
  await expect(page.getByLabel('标签 1 来源字段')).toHaveValue('event');
  await expect(page.getByLabel('标签 1 目标字段')).toHaveValue('事件名');
});

test('Sens：详情页消费正文标题、只读输入、映射图标、锚点和标题栏操作', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '详情视觉规则只需在标准桌面宽度执行一次。');
  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await fillBasicSource(page);
  await fillFieldMapping(page);
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByTestId('task-detail')).toBeVisible();

  const titleBar = page.locator('.sens-product-shell__title-bar');
  await expect(titleBar.getByRole('button', { name: '运行记录', exact: true })).toBeVisible();
  await expect(titleBar.getByRole('button', { name: /复\s*制/ })).toBeVisible();
  await expect(titleBar.getByRole('button', { name: /编\s*辑/ })).toBeVisible();

  const anchors = page.getByRole('navigation', { name: '详情页章节' });
  for (const name of ['任务基本信息', '数据来源和目标', '任务执行规则', '报警监控']) {
    await expect(anchors.getByRole('button', { name, exact: true })).toBeVisible();
  }

  const readonlyInputs = page.locator('.detail-mapping input[readonly]');
  await expect(readonlyInputs).toHaveCount(4);
  const detailStyles = await page.evaluate(() => {
    const label = document.querySelector<HTMLElement>('.detail-list dt');
    const value = document.querySelector<HTMLElement>('.detail-list dd');
    const cards = [...document.querySelectorAll<HTMLElement>('.detail-source-target .source-card')];
    const input = document.querySelector<HTMLElement>('.detail-mapping input[readonly]');
    const anchor = document.querySelector<HTMLElement>('.detail-anchors button');
    const basicList = document.querySelector<HTMLElement>('.detail-list--basic');
    const executionList = document.querySelector<HTMLElement>('.detail-list--wide');
    const statusRow = [...document.querySelectorAll<HTMLElement>('.detail-list--basic > div')]
      .find((element) => element.querySelector('dt')?.textContent === '任务状态');
    const descriptionRow = document.querySelector<HTMLElement>('.detail-description');
    const descriptionCard = document.querySelector<HTMLElement>('.detail-description .readonly-block');
    const consumeCard = document.querySelector<HTMLElement>('.detail-banner--consume');
    const hashCard = document.querySelector<HTMLElement>('.detail-banner--hash');
    const mappingCard = document.querySelector<HTMLElement>('.detail-mapping .mapping-panel');
    const alarmStatus = document.querySelector<HTMLElement>('.alarm-enabled');
    const alarmDot = document.querySelector<HTMLElement>('.alarm-enabled__dot');
    const alarmCard = document.querySelector<HTMLElement>('.detail-alarm');
    const alarmCondition = document.querySelector<HTMLElement>('.detail-alarm__condition');
    const alarmNotifyList = document.querySelector<HTMLElement>('.detail-alarm .notify-list');
    const style = (element: HTMLElement | null) => element ? getComputedStyle(element) : null;
    const padding = (element: HTMLElement | null) => {
      const computed = style(element);
      return computed
        ? [computed.paddingTop, computed.paddingRight, computed.paddingBottom, computed.paddingLeft]
        : [];
    };
    return {
      labelColor: style(label)?.color ?? null,
      labelFontSize: style(label)?.fontSize ?? null,
      labelLineHeight: style(label)?.lineHeight ?? null,
      labelFontWeight: style(label)?.fontWeight ?? null,
      valueColor: style(value)?.color ?? null,
      valueFontSize: style(value)?.fontSize ?? null,
      valueLineHeight: style(value)?.lineHeight ?? null,
      valueFontWeight: style(value)?.fontWeight ?? null,
      inputBackground: style(input)?.backgroundColor ?? null,
      sourceCardHeight: cards[0]?.getBoundingClientRect().height ?? 0,
      targetCardHeight: cards[1]?.getBoundingClientRect().height ?? 0,
      sourceCardTop: cards[0]?.getBoundingClientRect().top ?? 0,
      targetCardTop: cards[1]?.getBoundingClientRect().top ?? 0,
      sourceCardPadding: padding(cards[0]),
      targetCardPadding: padding(cards[1]),
      basicColumns: style(basicList)?.gridTemplateColumns ?? null,
      executionColumns: style(executionList)?.gridTemplateColumns ?? null,
      descriptionGap: descriptionRow && statusRow
        ? descriptionRow.getBoundingClientRect().top - statusRow.getBoundingClientRect().bottom
        : null,
      descriptionPadding: padding(descriptionCard),
      consumeMarginTop: style(consumeCard)?.marginTop ?? null,
      consumePadding: padding(consumeCard),
      hashMarginTop: style(hashCard)?.marginTop ?? null,
      hashPadding: padding(hashCard),
      mappingPadding: padding(mappingCard),
      alarmDotColor: style(alarmDot)?.backgroundColor ?? null,
      alarmGap: alarmStatus && alarmCard
        ? alarmCard.getBoundingClientRect().top - alarmStatus.getBoundingClientRect().bottom
        : null,
      alarmLeft: alarmStatus?.getBoundingClientRect().left ?? null,
      alarmCardLeft: alarmCard?.getBoundingClientRect().left ?? null,
      alarmPadding: padding(alarmCard),
      alarmConditionMargin: style(alarmCondition)?.margin ?? null,
      alarmConditionColumns: style(alarmCondition)?.gridTemplateColumns ?? null,
      alarmNotifyGap: style(alarmNotifyList)?.rowGap ?? null,
      anchorFontSize: style(anchor)?.fontSize ?? null,
      anchorLineHeight: style(anchor)?.lineHeight ?? null,
    };
  });
  expect(detailStyles.labelColor).toBe(detailStyles.valueColor);
  expect(detailStyles.labelFontSize).toBe('14px');
  expect(detailStyles.labelLineHeight).toBe('22px');
  expect(Number(detailStyles.labelFontWeight)).toBeGreaterThanOrEqual(600);
  expect(detailStyles.valueFontSize).toBe('14px');
  expect(detailStyles.valueLineHeight).toBe('22px');
  expect(Number(detailStyles.valueFontWeight)).toBeLessThan(600);
  expect(detailStyles.inputBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(detailStyles.sourceCardHeight).toBeGreaterThan(detailStyles.targetCardHeight);
  expect(detailStyles.sourceCardTop).toBe(detailStyles.targetCardTop);
  expect(detailStyles.sourceCardPadding).toEqual(['16px', '16px', '16px', '16px']);
  expect(detailStyles.targetCardPadding).toEqual(['16px', '16px', '16px', '16px']);
  expect(detailStyles.basicColumns?.split(' ')).toHaveLength(1);
  expect(detailStyles.executionColumns?.split(' ')).toHaveLength(1);
  expect(detailStyles.descriptionGap).toBe(20);
  expect(detailStyles.descriptionPadding).toEqual(['16px', '16px', '16px', '16px']);
  expect(detailStyles.consumeMarginTop).toBe('8px');
  expect(detailStyles.consumePadding).toEqual(['16px', '16px', '16px', '16px']);
  expect(detailStyles.hashMarginTop).toBe('8px');
  expect(detailStyles.hashPadding).toEqual(['16px', '16px', '16px', '16px']);
  expect(detailStyles.mappingPadding).toEqual(['16px', '16px', '16px', '16px']);
  expect(detailStyles.alarmDotColor).toBe('rgb(92, 184, 56)');
  expect(detailStyles.alarmGap).toBe(12);
  expect(detailStyles.alarmLeft).toBe(detailStyles.alarmCardLeft);
  expect(detailStyles.alarmPadding).toEqual(['16px', '16px', '16px', '16px']);
  expect(detailStyles.alarmConditionMargin).toBe('0px');
  expect(detailStyles.alarmConditionColumns?.split(' ')[0]).toBe('112px');
  expect(detailStyles.alarmNotifyGap).toBe('8px');
  expect(detailStyles.anchorFontSize).toBe('14px');
  expect(detailStyles.anchorLineHeight).toBe('22px');
  expect(await page.locator('.task-detail-page .mapping-link__glyph').count()).toBeGreaterThanOrEqual(3);
});

test('需求：暂停任务编辑保存后进入等待运行', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '编辑状态转换只需运行一次。');
  const row = page.getByRole('row').filter({ hasText: '已暂停的测试任务' });
  await row.getByRole('button', { name: '更多', exact: true }).click();
  await page.getByRole('menuitem', { name: '编辑', exact: true }).click();
  await expect(page.getByTestId('edit-task-form')).toBeVisible();
  await page.getByRole('button', { name: /保\s*存/ }).click();
  await expect(page.getByTestId('task-detail')).toBeVisible();
  await expect(page.getByText('等待运行', { exact: true })).toBeVisible();
});

test('需求：创建任务、数据预览与详情形成业务闭环', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '业务闭环只在标准桌面宽度执行一次。');
  const runtimeErrors = watchRuntime(page);
  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await expect(page.getByRole('heading', { name: '创建流任务' })).toBeVisible();
  await fillBasicSource(page);
  await fillFieldMapping(page);

  await page.getByRole('button', { name: '数据预览', exact: true }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByText('来源数据预览', { exact: true })).toBeVisible();
  await expect(drawer.getByText('正在获取来源数据', { exact: true })).toBeVisible();
  await expect(drawer.getByText('展示最新 3 条模拟数据，仅用于确认字段结构。', { exact: true })).toBeVisible();
  await drawer.getByRole('button', { name: /关\s*闭/ }).click();

  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByText('创建成功', { exact: true })).toBeVisible();
  await expect(page.getByTestId('task-detail')).toBeVisible();
  await expect(page.getByText('订单同步流任务', { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel('来源侧用户标识字段')).toHaveValue('user id');
  await expect(page.getByLabel('目标侧用户标识字段')).toHaveValue('用户 ID');
  await expect(page.getByLabel('标签 1 来源字段')).toHaveValue('event');
  await expect(page.getByLabel('标签 1 目标字段')).toHaveValue('事件名');
  await expect(page.getByText('首次消费起始', { exact: true })).toBeVisible();
  await expect(page.getByText('追加更新', { exact: true })).toBeVisible();
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});

test('需求：标准 JSON 模式自动确定目标并隐藏字段映射', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '标准 JSON 分支只需运行一次。');
  const runtimeErrors = watchRuntime(page);
  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await fillBasicSource(page, true);
  await expect(page.getByText('“神策标准 JSON 格式”数据，无需配置同步目标和字段映射', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByTestId('task-detail')).toBeVisible();
  await expect(page.getByText('“神策标准 JSON 格式”数据，无需配置同步目标和字段映射', { exact: true })).toBeVisible();
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});

test('交互：必填校验、放弃确认和服务端失败均有反馈', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '交互门禁只需运行一次。');
  const runtimeErrors = watchRuntime(page);
  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByText('请输入任务名称', { exact: true })).toBeVisible();
  await page.getByPlaceholder('请输入', { exact: true }).first().fill('未完成任务');
  await page.getByRole('button', { name: /放\s*弃/ }).click();
  await expect(page.getByText('确定放弃当前编辑吗？', { exact: true })).toBeVisible();
  for (const name of ['确定放弃', '继续编辑']) {
    const button = page.getByRole('button', { name, exact: true });
    await expect(button).toHaveCSS('height', '24px');
    await expect(button).toHaveCSS('font-size', '12px');
  }
  await page.getByRole('button', { name: '继续编辑', exact: true }).click();
  await expect(page.getByTestId('create-task-form')).toBeVisible();

  await page.goto('/?submitResult=failure');
  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await fillBasicSource(page);
  await fillFieldMapping(page);
  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByText('创建失败，请稍后重试', { exact: true })).toBeVisible();
  await expect(page.getByTestId('create-task-form')).toBeVisible();
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});

test('视觉与交付：三档桌面宽度无整页横向溢出', async ({ page }, testInfo) => {
  const runtimeErrors = watchRuntime(page);
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const listWidth = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    overflowing: Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .map((element) => ({
        tag: element.tagName,
        className: element.className?.toString().slice(0, 100),
        right: Math.round(element.getBoundingClientRect().right),
        width: Math.round(element.getBoundingClientRect().width),
      }))
      .filter((item) => item.right > window.innerWidth + 1)
      .slice(0, 12),
  }));
  expect(listWidth.documentWidth, JSON.stringify(listWidth.overflowing)).toBeLessThanOrEqual(listWidth.viewportWidth);

  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await expect(page.getByTestId('create-task-form')).toBeVisible();
  const formWidth = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }));
  expect(formWidth.documentWidth).toBeLessThanOrEqual(formWidth.viewportWidth);
  await page.screenshot({ path: testInfo.outputPath(`create-${viewport!.width}.png`), fullPage: true });
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([]);
});

test('场景：配额满和仅查看权限正确禁用管理操作', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '权限场景只需运行一次。');
  await page.goto('/?quota=full');
  await expect(page.getByText('2 / 2', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await fillBasicSource(page);
  await expect(page.locator('.boxed-row').getByRole('radio', { name: '是', exact: true })).toBeDisabled();
  await expect(page.getByText('无可用配额，如需继续增加，请联系客户成功经理', { exact: true })).toBeVisible();
  await page.goto('/?permission=view');
  await expect(page.getByText('当前为仅查看权限，管理操作不可用', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '创建任务', exact: true })).toBeDisabled();
});

test('场景：Licence 未开通时隐藏创建任务入口', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'Licence 场景只需运行一次。');
  await page.goto('/?license=off');
  await expect(page.getByTestId('stream-task-list')).toBeVisible();
  await expect(page.getByRole('button', { name: '创建任务', exact: true })).toHaveCount(0);
  await expect(page.getByText('当前为仅查看权限，管理操作不可用', { exact: true })).toHaveCount(0);
});

test('审核证据：生成 P1 收口关键状态截图', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '审核截图只在标准桌面宽度生成一次。');
  await page.setViewportSize({ width: 1440, height: 900 });
  const screenshotDirectory = '../acceptance/screenshots/2026-09-22';

  await page.screenshot({ path: `${screenshotDirectory}/01-list-loaded-1440.png` });
  const row = page.getByRole('row').filter({ hasText: '订单实时同步' });
  await row.getByRole('button', { name: '更多', exact: true }).click();
  await page.getByRole('menuitem', { name: '删除', exact: true }).click();
  await expect(page.getByText('确认要删除该任务吗？', { exact: true })).toBeVisible();
  await expect(page.locator('.sens-dropdown-menu-overlay')).toBeHidden();
  await page.screenshot({ path: `${screenshotDirectory}/02-list-delete-confirm-1440.png` });
  await page.getByRole('button', { name: /取\s*消/ }).click();

  await page.getByRole('button', { name: '创建任务', exact: true }).click();
  await page.screenshot({ path: `${screenshotDirectory}/03-create-initial-1440.png` });
  await fillBasicSource(page);
  await fillFieldMapping(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('.ant-select-dropdown:visible')).toHaveCount(0);
  await page.locator('#source-target').evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `${screenshotDirectory}/04-create-field-mapping-1440.png` });

  await page.locator('#execution-rules').evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `${screenshotDirectory}/05-create-execution-1440.png` });
  await page.getByRole('button', { name: /高级设置/ }).click();
  await page.locator('#alarm-monitor').evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `${screenshotDirectory}/06-create-alarm-1440.png` });

  await page.getByRole('button', { name: /提\s*交/ }).click();
  await expect(page.getByTestId('task-detail')).toBeVisible();
  await page.locator('.sens-product-shell__scroll').evaluate((element) => element.scrollTo(0, 0));
  await page.mouse.move(720, 700);
  await page.screenshot({ path: `${screenshotDirectory}/07-detail-created-1440.png` });

  await page.locator('#detail-alarm').evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.mouse.move(720, 700);
  await page.screenshot({ path: `${screenshotDirectory}/08-detail-alarm-1440.png` });

  await page.goto('/');
  const buriedGroup = page.locator('.sens-product-shell-side-navigation').getByRole('button', { name: '埋点数据接入', exact: true });
  await buriedGroup.click();
  await expect(buriedGroup).toHaveAttribute('aria-expanded', 'false');
  await page.screenshot({ path: `${screenshotDirectory}/09-list-side-group-collapsed-1440.png` });
});
