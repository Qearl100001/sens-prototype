import { useEffect, useMemo, useState } from 'react';
import {
  PRODUCT_SHELL_SIDE_NAV_ICON_COLLAPSED_WIDTH,
  ProductShellSideNavigation,
  SensButton,
  SensEntryCard,
  SensIcon,
  SensPageTitleBar,
  SensProductShell,
  SensSectionTitle,
  SensTopNavigation,
  type IconName,
  type ProductShellSideNavigationMode,
  useSensMessage,
} from '@sens/prototype-kit';
import { CalendarView } from './components/CalendarView';
import {
  BatchEditDrawer,
  NotificationDrawer,
  SingleEditDrawer,
  UploadDrawer,
} from './components/TradingCalendarDrawers';
import {
  TODAY,
  calendarState,
  createInitialOverrides,
  datesInRange,
  type CalendarOverride,
  type CalendarStatus,
  type DateRangeRule,
} from './domain';

const topNavigationItems = [
  { label: 'Sensors AI' }, { label: '可视化', arrow: true }, { label: '分析', arrow: true },
  { label: '指标平台' }, { label: '标签管理', arrow: true }, { label: '分群' },
  { label: '智能运营', arrow: true }, { label: '数据管理', arrow: true }, { label: '平台管理', arrow: true },
];

const sideGroups = [
  {
    key: 'global',
    label: '全局信息',
    icon: 'sbp-setting' as const,
    items: ['授权信息'],
    defaultExpanded: true,
  },
  {
    key: 'members',
    label: '成员与角色',
    icon: 'sbp-overview' as const,
    items: ['平台账号管理', '成员管理', '角色管理'],
    defaultExpanded: true,
  },
  {
    key: 'project',
    label: '项目管理',
    icon: 'sbp-member' as const,
    items: ['基本设置', '资产箱'],
    defaultExpanded: true,
  },
  {
    key: 'general',
    label: '通用设置',
    icon: 'sbp-security-setting' as const,
    items: ['安全设置', '发件箱设置', '品牌信息设置', '全局文案设置', '第三方登录设置', '配置项设置'],
    defaultExpanded: true,
  },
  {
    key: 'operations',
    label: '运维管理',
    icon: 'sbp-operation-log' as const,
    items: ['触达通道管理'],
    defaultExpanded: true,
  },
];

type BasicSettingsCard = {
  title: string;
  description: string;
  icon: IconName;
  target?: 'trading-calendar';
};

const basicSettingSections: Array<{ title: string; cards: BasicSettingsCard[] }> = [
  {
    title: '通用',
    cards: [
      { title: '多时区设置', description: '为跨时区业务统一项目时间展示和计算口径', icon: 'time-zones-setting' as const },
      { title: '日期标注', description: '标注日期信息，供分析模型和概览使用', icon: 'date-mark' as const },
      { title: '交易日历', description: '统一管理交易日历，供分析模型、标签分群等业务使用', icon: 'date-mark' as const, target: 'trading-calendar' as const },
      { title: '查看 API Secret', description: '查看项目 API Secret 及相关安全提示', icon: 'view-api' as const },
      { title: '汇率转换规则', description: '用于不同币种之间的汇率换算', icon: 'exchange-rate-rule' as const },
    ],
  },
  {
    title: '分析',
    cards: [
      { title: '下载资源报告', description: '查看近期项目资源的使用情况', icon: 'download-resource-report' as const },
      { title: '企业内部触达通道配置', description: '配置常见办公软件的消息通知通道', icon: 'webhook-setting' as const },
      { title: '分析模型设置', description: '调整分析模型的项目级配置', icon: 'analysis-model-setting' as const },
      { title: '推送管理', description: '管理与用户分群相关的推送配置', icon: 'push-management' as const },
    ],
  },
];

type ShellPage = 'basic-settings' | 'trading-calendar';

function pageFromLocation(): ShellPage {
  return new URLSearchParams(window.location.search).get('page') === 'basic-settings' ? 'basic-settings' : 'trading-calendar';
}

function DisabledAction({ label, reason }: { label: string; reason: string }) {
  return (
    <span className="disabled-action" title={reason}>
      <SensButton tone="secondary" disabled>{label}</SensButton>
    </span>
  );
}

export function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const canManage = params.get('permission') !== 'view';
  const startsUninitialized = params.get('scenario') === 'uninitialized';
  const message = useSensMessage();
  const [sideNavigationMode, setSideNavigationMode] = useState<ProductShellSideNavigationMode>('docked');
  const [shellPage, setShellPage] = useState<ShellPage>(pageFromLocation);
  const [year, setYear] = useState(TODAY.getFullYear());
  const [month, setMonth] = useState(TODAY.getMonth());
  const [view, setView] = useState<'month' | 'year'>('month');
  const [overrides, setOverrides] = useState(createInitialOverrides);
  const [initialized, setInitialized] = useState(!startsUninitialized);
  const [firstVisit, setFirstVisit] = useState(startsUninitialized);
  const [notificationOpen, setNotificationOpen] = useState(startsUninitialized);
  const [singleEditDate, setSingleEditDate] = useState<string | null>(null);
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const selectedDate = singleEditDate ? calendarState(new Date(`${singleEditDate}T00:00:00`), overrides) : null;
  const lockedReason = '请先完成交易日历上传提醒配置，并补充通知接收人后使用';

  useEffect(() => {
    const syncPage = () => setShellPage(pageFromLocation());
    window.addEventListener('popstate', syncPage);
    return () => window.removeEventListener('popstate', syncPage);
  }, []);

  const navigateTo = (nextPage: ShellPage) => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('page', nextPage);
    window.history.pushState({}, '', nextUrl);
    setShellPage(nextPage);
  };

  const saveSingleDate = (value: CalendarOverride) => {
    setOverrides((current) => new Map(current).set(value.date, value));
    setSingleEditDate(null);
    message.success('保存成功');
  };

  const saveRanges = (ranges: DateRangeRule[], status: CalendarStatus, note: string) => {
    setOverrides((current) => {
      const next = new Map(current);
      ranges.forEach((range) => {
        datesInRange(range.start, range.end).forEach((date) => next.set(date, { date, status, note }));
      });
      return next;
    });
    setBatchEditOpen(false);
    message.success('保存成功');
  };

  const actions = canManage ? (
    <>
      <SensButton tone="secondary" onClick={() => { setFirstVisit(false); setNotificationOpen(true); }}>通知配置</SensButton>
      {initialized ? (
        <SensButton tone="secondary" onClick={() => setUploadOpen(true)}>批量上传</SensButton>
      ) : <DisabledAction label="批量上传" reason={lockedReason} />}
      {initialized ? (
        <SensButton tone="primary" onClick={() => setBatchEditOpen(true)}>编辑</SensButton>
      ) : <DisabledAction label="编辑" reason={lockedReason} />}
    </>
  ) : undefined;

  return (
    <>
      <SensProductShell
        layout={shellPage === 'basic-settings' ? 't' : 'vertical'}
        className={`trading-product-shell trading-product-shell--${shellPage}`}
        sideNavigationMode={sideNavigationMode}
        collapsedSideWidth={PRODUCT_SHELL_SIDE_NAV_ICON_COLLAPSED_WIDTH}
        contentLabel={shellPage === 'basic-settings' ? '平台管理基本设置' : '交易日历管理'}
        scrollClassName={shellPage === 'basic-settings' ? 'product-shell-scroll--landing' : 'product-shell-scroll--drilldown'}
        topNavigation={<SensTopNavigation embedded activeNavLabel="平台管理" items={topNavigationItems} />}
        sideNavigation={shellPage === 'basic-settings' ? (
          <div className="product-shell-side-container">
            <ProductShellSideNavigation
              mode={sideNavigationMode}
              onModeChange={setSideNavigationMode}
              productName="平台管理"
              activeItem="基本设置"
              groups={sideGroups}
              onActiveItemChange={(item) => {
                if (item === '基本设置') navigateTo('basic-settings');
                else message.info('当前原型仅覆盖基本设置与交易日历。');
              }}
            />
          </div>
        ) : undefined}
        titleBar={shellPage === 'basic-settings' ? (
          <SensPageTitleBar className="calendar-title-bar calendar-title-bar--landing" variant="landing" title="基本设置" />
        ) : (
          <SensPageTitleBar
            className="calendar-title-bar calendar-title-bar--drilldown"
            variant="drilldown"
            title="交易日历"
            description="统一维护 A 股交易日规则"
            breadcrumbItems={[{ key: 'basic-settings', label: '基本设置', onClick: () => navigateTo('basic-settings') }, { key: 'trading-calendar', label: '交易日历' }]}
            onBack={() => navigateTo('basic-settings')}
            actions={actions}
          />
        )}
      >
        {shellPage === 'basic-settings' ? (
          <div className="basic-settings-shell" data-testid="basic-settings-page">
            {basicSettingSections.map((section) => (
              <section className="settings-section" key={section.title}>
                <SensSectionTitle title={section.title} />
                <div className="entry-card-grid">
                  {section.cards.map((card) => (
                    <SensEntryCard
                      key={card.title}
                      aria-label={card.title}
                      size="small"
                      icon={<SensIcon name={card.icon} variant="colorful" size={48} />}
                      title={card.title}
                      description={card.description}
                      onClick={() => card.target ? navigateTo(card.target) : message.info('当前原型仅覆盖交易日历。')}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : <div className="trading-calendar-shell">
          {!initialized ? (
            <div className="notice-banner notice-banner--warning initialization-warning" role="status">
              <span>请先完成通知初始化：前往“通知配置”配置站内通知、邮件或 Webhook，并添加通知接收人。完成前，“批量上传”“编辑”暂不可用。</span>
              <SensButton tone="link" onClick={() => { setFirstVisit(false); setNotificationOpen(true); }}>前往配置</SensButton>
            </div>
          ) : null}
          {!canManage ? (
            <div className="notice-banner notice-banner--info" role="status">当前账号仅有交易日查询权限，管理操作已隐藏。</div>
          ) : null}
          <CalendarView
            year={year}
            month={month}
            view={view}
            overrides={overrides}
            onNavigate={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }}
            onViewChange={setView}
            onSelectDate={(date) => canManage && initialized ? setSingleEditDate(date) : message.info(canManage ? lockedReason : '当前账号仅有交易日查询权限')}
          />
        </div>}
      </SensProductShell>

      <SingleEditDrawer open={Boolean(singleEditDate)} value={selectedDate} onClose={() => setSingleEditDate(null)} onSave={saveSingleDate} />
      <BatchEditDrawer open={batchEditOpen} onClose={() => setBatchEditOpen(false)} onSave={saveRanges} />
      <UploadDrawer
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => { setUploadOpen(false); message.success('导入成功'); }}
      />
      <NotificationDrawer
        open={notificationOpen}
        initialized={initialized}
        firstVisit={firstVisit}
        onClose={() => setNotificationOpen(false)}
        onSkip={() => { setFirstVisit(false); setNotificationOpen(false); }}
        onSave={() => { setInitialized(true); setFirstVisit(false); setNotificationOpen(false); message.success('保存成功，交易日历管理功能已解锁'); }}
      />
    </>
  );
}
