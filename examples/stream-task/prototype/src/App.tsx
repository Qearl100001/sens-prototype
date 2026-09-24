import { useMemo, useState } from 'react';
import {
  PRODUCT_SHELL_SIDE_NAV_ICON_COLLAPSED_WIDTH,
  ProductShellSideNavigation,
  SensButton,
  SensPageTitleBar,
  SensPopover,
  SensProductShell,
  SensTopNavigation,
  type ProductShellSideNavigationMode,
  useSensMessage,
} from '@sens/prototype-kit';
import { DataPreviewDrawer } from './components/DataPreviewDrawer';
import { StreamTaskDetail } from './components/StreamTaskDetail';
import { type FormErrors, StreamTaskForm } from './components/StreamTaskForm';
import { StreamTaskList } from './components/StreamTaskList';
import {
  EMPTY_DRAFT,
  INITIAL_TASKS,
  SOURCE_CONNECTIONS,
  SOURCE_DATA,
  SCHEMA_OPTIONS,
  TARGET_DATA_OPTIONS,
  draftFromTask,
  type PageMode,
  type StreamTask,
  type TaskDraft,
} from './domain';

const topNavigationItems = [
  { label: 'Sensors AI' }, { label: '可视化', arrow: true }, { label: '分析', arrow: true },
  { label: '指标平台' }, { label: '标签管理', arrow: true }, { label: 'A/B 测试', arrow: true },
  { label: '分群' }, { label: '渠道追踪', arrow: true }, { label: '智能运营', arrow: true },
  { label: '数据管理', arrow: true }, { label: '更多', arrow: true },
];

const sideGroups = [
  { key: 'buried', label: '埋点数据接入', icon: 'sdi-warehousing-data-ingestion' as const, items: ['数据接入引导', '入库校验规则设置', '事件采样率设置', '实时导入数据查询'], defaultExpanded: true },
  { key: 'integration', label: '通用数据集成', icon: 'sdh-warehousing-general-data-ingestion' as const, items: ['数据源管理', '数据表管理', '数据同步', '推送任务'], defaultExpanded: true },
  { key: 'metadata', label: '元数据管理', icon: 'sdh-data-model-table-manage' as const, items: ['用户表', '事件表', '明细表'], defaultExpanded: true },
  { key: 'quality', label: '数据质量', icon: 'sdg-dataquality' as const, items: ['埋点数据查询', '数据校验', '用户关联校验'], defaultExpanded: true },
];

export function App() {
  const message = useSensMessage();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const canManage = params.get('permission') !== 'view';
  const licenseEnabled = params.get('license') !== 'off';
  const quota = params.get('quota') === 'full' ? 2 : 3;
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [mode, setMode] = useState<PageMode>('list');
  const [selectedTask, setSelectedTask] = useState<StreamTask | null>(null);
  const [draft, setDraft] = useState<TaskDraft>({ ...EMPTY_DRAFT, mappings: [...EMPTY_DRAFT.mappings], hashFields: [...EMPTY_DRAFT.hashFields] });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [sideNavigationMode, setSideNavigationMode] = useState<ProductShellSideNavigationMode>('docked');
  const runningCount = tasks.filter((task) => task.status === 'running' || task.status === 'abnormal').length;
  const quotaFull = runningCount >= quota;

  const resetDraft = () => setDraft({
    ...EMPTY_DRAFT,
    mappings: EMPTY_DRAFT.mappings.map((item) => ({ ...item })),
    hashFields: [...EMPTY_DRAFT.hashFields],
  });
  const goList = () => {
    setMode('list');
    setSelectedTask(null);
    setErrors({});
    setAbandonOpen(false);
    setPreviewOpen(false);
  };
  const openCreate = () => {
    if (!licenseEnabled) {
      message.warning('当前许可未开通流任务创建能力');
      return;
    }
    resetDraft();
    setErrors({});
    setMode('create');
  };
  const openDetail = (task: StreamTask) => {
    setSelectedTask(task);
    setDraft(draftFromTask(task));
    setMode('detail');
  };
  const openEdit = (task: StreamTask) => {
    setSelectedTask(task);
    setDraft(draftFromTask(task));
    setErrors({});
    setMode('edit');
  };
  const openCopy = (task: StreamTask) => {
    setSelectedTask(task);
    setDraft({ ...draftFromTask(task), name: task.name + '_copy' });
    setErrors({});
    setMode('copy');
  };

  const validate = () => {
    const next: FormErrors = {};
    if (!draft.name.trim()) next.name = '请输入任务名称';
    else if (!/^[\u4e00-\u9fa5A-Za-z0-9_]+$/.test(draft.name)) next.name = '仅支持中文、英文、数字和下划线';
    else if (draft.name.length > 100) next.name = '任务名称不能超过 100 个字符';
    if (!draft.sourceConnection) next.sourceConnection = '请选择来源连接';
    if (!draft.sourceData) next.sourceData = '请选择来源数据';
    if (!draft.schema) next.schema = '请选择 Schema';
    if (!draft.standardJson && !draft.targetData) next.targetData = '请选择目标数据';
    if (!draft.standardJson && draft.schema && draft.targetData) {
      if (!draft.userKeySource) next.userKeySource = '请选择来源侧用户标识字段';
      if (!draft.userKeyTarget) next.userKeyTarget = '请选择目标侧用户标识字段';
      if (draft.mappings.some((mapping) => !mapping.source || !mapping.target)) next.mappings = '请填写完整的标签值字段映射';
    }
    if (draft.runImmediately && quotaFull) next.runImmediately = '当前运行配额已用尽';
    if (draft.consumeStart === 'timestamp' && (draft.timestamp === null || draft.timestamp < 0)) next.timestamp = '请输入非负时间戳';
    if (draft.consumeStart === 'offset' && (draft.offset === null || draft.offset < 0)) next.offset = '请输入非负偏移量';
    if (draft.parallelism !== null && (draft.parallelism < 1 || draft.parallelism > 128)) next.parallelism = '范围为 1–128';
    if (draft.alarmEnabled && draft.alarmRestartEnabled && (draft.alarmWindow === null || draft.alarmRetries === null)) next.alarmRestart = '请填写完整的任务重启报警条件';
    if (draft.alarmEnabled && draft.alarmInvalidEnabled && (draft.alarmInvalidWindow === null || draft.alarmInvalidCount === null)) next.alarmInvalid = '请填写完整的异常数据报警条件';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!validate() || submitting) {
      if (!submitting) {
        document.querySelector('.field-error, [data-status="error"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        message.warning('请检查并补充必填信息');
      }
      return;
    }
    setSubmitting(true);
    const closeLoading = message.loading(mode === 'edit' ? '保存中' : '提交中');
    window.setTimeout(() => {
      closeLoading();
      setSubmitting(false);
      if (params.get('submitResult') === 'failure') {
        message.warning(mode === 'edit' ? '保存失败，请稍后重试' : '创建失败，请稍后重试');
        return;
      }
      const now = '2026-09-20 16:30';
      if (mode === 'edit' && selectedTask) {
        const updated = taskFromDraft(selectedTask.id, draft, selectedTask.createdAt, now, 'waiting');
        setTasks((current) => current.map((item) => item.id === selectedTask.id ? updated : item));
        setSelectedTask(updated);
        setMode('detail');
        message.success('保存成功');
        return;
      }
      const id = Math.max(...tasks.map((task) => task.id), 0) + 1;
      const status = draft.runImmediately ? 'running' : 'waiting';
      const created = taskFromDraft(id, draft, now, now, status);
      setTasks((current) => [created, ...current]);
      setSelectedTask(created);
      setMode('detail');
      message.success(mode === 'copy' ? '复制创建成功' : '创建成功');
    }, 650);
  };

  const toggleStatus = (task: StreamTask) => {
    const running = task.status === 'running' || task.status === 'abnormal';
    const next = { ...task, status: running ? 'paused' as const : 'running' as const, updatedAt: '2026-09-20 16:30' };
    setTasks((current) => current.map((item) => item.id === task.id ? next : item));
    message.success(running ? '任务已暂停' : '任务已开始运行');
  };

  const isList = mode === 'list';
  const isDetail = mode === 'detail';
  const formMode = mode === 'edit' ? 'edit' : mode === 'copy' ? 'copy' : 'create';
  const title = mode === 'edit' ? '编辑流任务' : mode === 'copy' ? '复制流任务' : '创建流任务';
  const isEmptyCreateDraft = mode === 'create' && JSON.stringify(draft) === JSON.stringify(EMPTY_DRAFT);
  const leaveForm = () => {
    if (isEmptyCreateDraft) goList();
    else setAbandonOpen(true);
  };

  const formActions = (
    <>
      <SensPopover
        open={abandonOpen}
        onOpenChange={(open) => {
          if (!open) setAbandonOpen(false);
          else leaveForm();
        }}
        variant="confirm"
        size="small"
        placement="bottom"
        align="end"
        title="确定放弃当前编辑吗？"
        content="放弃后，当前填写内容将不会保留。"
        actions={(
          <>
            <SensButton size="small" tone="dangerSecondary" onClick={() => { goList(); message.default('已放弃当前编辑'); }}>确定放弃</SensButton>
            <SensButton size="small" tone="primary" onClick={() => setAbandonOpen(false)}>继续编辑</SensButton>
          </>
        )}
      >
        <SensButton tone="secondary">放弃</SensButton>
      </SensPopover>
      <SensButton tone="secondary" disabled={!draft.schema} onClick={() => setPreviewOpen(true)}>数据预览</SensButton>
      <SensButton tone="primary" loading={submitting} onClick={submit}>{mode === 'edit' ? '保存' : '提交'}</SensButton>
    </>
  );
  const detailActions = selectedTask ? (
    <>
      <SensButton tone="secondary" onClick={() => message.info('运行记录将在后续版本接入')}>运行记录</SensButton>
      <SensButton tone="secondary" onClick={() => openCopy(selectedTask)}>复制</SensButton>
      <SensButton
        tone="primary"
        disabled={selectedTask.status === 'running' || selectedTask.status === 'abnormal'}
        title={selectedTask.status === 'running' || selectedTask.status === 'abnormal' ? '运行中的任务不支持编辑操作' : undefined}
        onClick={() => openEdit(selectedTask)}
      >
        编辑
      </SensButton>
    </>
  ) : undefined;

  return (
    <>
      <SensProductShell
        layout={isList ? 't' : 'vertical'}
        sideNavigationMode={isList ? sideNavigationMode : undefined}
        collapsedSideWidth={PRODUCT_SHELL_SIDE_NAV_ICON_COLLAPSED_WIDTH}
        contentLabel={isList ? '数据同步流任务列表' : isDetail ? '流任务详情' : title}
        topNavigation={<SensTopNavigation embedded activeNavLabel="数据管理" items={topNavigationItems} />}
        sideNavigation={isList ? (
          <ProductShellSideNavigation
            mode={sideNavigationMode}
            onModeChange={setSideNavigationMode}
            productName="数据管理"
            activeItem="数据同步"
            groups={sideGroups}
          />
        ) : undefined}
        titleBar={isList ? (
          <SensPageTitleBar variant="landing" title="数据同步" />
        ) : (
          <SensPageTitleBar
            variant="drilldown"
            title={isDetail ? selectedTask?.name ?? '流任务详情' : title}
            breadcrumbItems={[
              { key: 'data', label: '数据接入' },
              { key: 'integration', label: '通用数据接入' },
              { key: 'sync', label: '数据同步' },
              { key: 'current', label: isDetail ? '任务详情' : title },
            ]}
            onBack={isDetail ? goList : leaveForm}
            actions={isDetail ? detailActions : formActions}
          />
        )}
      >
        {isList ? (
          <StreamTaskList
            tasks={tasks}
            quota={quota}
            canManage={canManage}
            showCreate={licenseEnabled}
            onCreate={openCreate}
            onView={openDetail}
            onEdit={openEdit}
            onCopy={openCopy}
            onToggleStatus={toggleStatus}
            onDelete={(task) => { setTasks((current) => current.filter((item) => item.id !== task.id)); message.success('删除成功'); }}
            onDownloadLog={(task) => message.success(task.name + ' 的日志已导出')}
          />
        ) : isDetail && selectedTask ? (
          <StreamTaskDetail task={selectedTask} />
        ) : (
          <StreamTaskForm mode={formMode} draft={draft} errors={errors} quotaFull={quotaFull} onChange={(next) => { setDraft(next); setErrors({}); }} />
        )}
      </SensProductShell>
      <DataPreviewDrawer open={previewOpen} draft={draft} onClose={() => setPreviewOpen(false)} />
    </>
  );
}

function taskFromDraft(
  id: number,
  draft: TaskDraft,
  createdAt: string,
  updatedAt: string,
  status: StreamTask['status'],
): StreamTask {
  const sourceConnection = SOURCE_CONNECTIONS.find((item) => item.value === draft.sourceConnection)?.label ?? draft.sourceConnection;
  const sourceData = (SOURCE_DATA[draft.sourceConnection] ?? []).find((item) => item.value === draft.sourceData)?.label ?? draft.sourceData;
  const schema = (SCHEMA_OPTIONS[draft.sourceData] ?? []).find((item) => item.value === draft.schema)?.label ?? draft.schema;
  const targetData = draft.standardJson
    ? '事件表（自动识别）'
    : TARGET_DATA_OPTIONS.find((item) => item.value === draft.targetData)?.label ?? draft.targetData;
  return {
    id,
    name: draft.name,
    status,
    creator: '当前用户',
    createdAt,
    updatedAt,
    description: draft.description,
    sourceConnection,
    sourceData,
    schema,
    standardJson: draft.standardJson,
    targetData,
    userKeySource: draft.userKeySource,
    userKeyTarget: draft.userKeyTarget,
    mappings: draft.mappings.map((mapping) => ({ ...mapping })),
    consumeStart: draft.consumeStart,
    partitionMode: draft.partitionMode,
    hashFields: draft.hashFields,
    skipInvalid: draft.skipInvalid,
    parallelism: draft.parallelism,
    optimization: draft.optimization,
    alarmEnabled: draft.alarmEnabled,
    alarmWindow: draft.alarmWindow ?? 10,
    alarmRetries: draft.alarmRetries ?? 5,
  };
}
