import { useMemo, useState } from 'react';
import {
  SearchInput, SensButton, SensCheckbox, SensDrawer, SensEmptyState, SensForm,
  SensFormItem, SensIcon, SensInput, SensInputNumber, SensPageTitleBar, SensPopover,
  SensProductShell, SensRadio, SensRadioGroup, SensSectionTitle, SensSelectDropdown,
  SensTextArea, SensTitleBar, SensTopNavigation,
} from '@sens/prototype-kit';

type SelectionMode = 'single' | 'multiple';
type FeatureOption = { id: string; label: string; description?: string };
type FeatureDisplayMode = 'missing-range' | 'operator-value' | 'range-options' | 'selection-mode';
type NumberMode = 'range' | 'discrete';

const featureOptions: FeatureOption[] = [
  { id: 'age', label: 'Age' }, { id: 'app-channel', label: 'App 安装渠道' },
  { id: 'app-channel-test', label: 'App 安装渠道测试' }, { id: 'income-level', label: 'IncomeLevel' },
  { id: 'ab-version', label: 'ab_version' },
  { id: 'ctmd', label: 'Exclusion Rules for CTMD', description: '信贷分期业务排除规则' },
  { id: 'abtest-approval', label: 'abtest_approval_experiment_num' },
  { id: 'abtest-business', label: 'abtest_business_metric_num' },
  { id: 'abtest-code', label: 'abtest_code_experiment_num' },
  { id: 'abtest-custom', label: 'abtest_custom_attribute_experiment_num' },
  { id: 'abtest-debug', label: 'abtest_debug_device_num' },
  { id: 'abtest-debugging', label: 'abtest_debuging_experiment_num' },
  { id: 'abtest-draft', label: 'abtest_draft_experiment_num' },
  { id: 'abtest-group', label: 'abtest_group_experiment_num' },
  { id: 'abtest-layer', label: 'abtest_layer_num' }, { id: 'abtest-link', label: 'abtest_link_experiment_num' },
  { id: 'abtest-metric', label: 'abtest_metric_num' }, { id: 'abtest-nonsticky', label: 'abtest_nonsticky_experiment_num' },
  { id: 'abtest-over', label: 'abtest_over_experiment_num' },
  { id: 'abtest-preparing', label: 'abtest_preparing_experiment_num' },
  { id: 'abtest-random', label: 'abtest_random_experiment_num' },
];
const valueOptionsByFeature: Record<string, string[]> = {
  'app-channel': ['App Store', 'Google Play', '华为应用市场', '小米应用商店', '应用宝', 'OPPO 软件商店', 'vivo 应用商店'],
  'income-level': ['高收入', '中等收入', '低收入', '未知'],
  'ab-version': ['ab_version_1', 'ab_version_2', 'ab_version_3', 'control'],
};
const allCandidates = ['Yes', 'No', 'Unknown', 'Not Applicable'];
const defaultRanges = ['0 以下', '0-200', '200-400', '400-600', '600-800', '800-1000', '1000-1200', '1200-1400'];
const featureDisplayModeById: Partial<Record<string, FeatureDisplayMode>> = {
  'app-channel': 'operator-value', 'income-level': 'operator-value', 'ab-version': 'operator-value',
  'abtest-metric': 'range-options', ctmd: 'selection-mode',
};
const topNavigationItems = [
  { label: 'Sensors AI' }, { label: '可视化', arrow: true }, { label: '分析', arrow: true },
  { label: '指标平台' }, { label: '标签管理', arrow: true }, { label: 'A/B 测试', arrow: true },
  { label: '分群' }, { label: '渠道追踪', arrow: true }, { label: '智能运营', arrow: true },
  { label: '数据服务', arrow: true }, { label: '更多', arrow: true },
];
const sameValues = (a: string[], b: string[]) => a.length === b.length && a.every((value) => b.includes(value));

export function App() {
  const [entity, setEntity] = useState('user');
  const [templateName, setTemplateName] = useState('实体筛选特征模板4');
  const [remark, setRemark] = useState('');
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [normalExpanded, setNormalExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [draftFeatureIds, setDraftFeatureIds] = useState<string[]>([]);
  const [savedFeatureIds, setSavedFeatureIds] = useState<string[]>([]);
  const [savingFeatures, setSavingFeatures] = useState(false);
  const [addAbandonOpen, setAddAbandonOpen] = useState(false);
  const [valueFeatureId, setValueFeatureId] = useState<string | null>(null);
  const [valueSearch, setValueSearch] = useState('');
  const [featureValues, setFeatureValues] = useState<Record<string, string[]>>({});
  const [valueSelectionModeByFeature, setValueSelectionModeByFeature] = useState<Record<string, SelectionMode>>({});
  const [draftValueSelectionMode, setDraftValueSelectionMode] = useState<SelectionMode>('multiple');
  const [draftValues, setDraftValues] = useState<string[]>([]);
  const [showOtherByFeature, setShowOtherByFeature] = useState<Record<string, boolean>>({});
  const [draftShowOther, setDraftShowOther] = useState(false);
  const [valueAbandonOpen, setValueAbandonOpen] = useState(false);
  const [expandedValueRows, setExpandedValueRows] = useState<string[]>([]);
  const [ctmdDrawerOpen, setCtmdDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savedMode, setSavedMode] = useState<SelectionMode>('multiple');
  const [draftMode, setDraftMode] = useState<SelectionMode>('multiple');
  const [savedCandidates, setSavedCandidates] = useState(['Yes', 'No']);
  const [draftCandidates, setDraftCandidates] = useState(['Yes', 'No']);
  const [savedShowOther, setSavedShowOther] = useState(true);
  const [draftCtmdShowOther, setDraftCtmdShowOther] = useState(true);
  const [applicationValue, setApplicationValue] = useState('Yes');
  const [settingsFeatureId, setSettingsFeatureId] = useState<string | null>(null);
  const [numberMode, setNumberMode] = useState<NumberMode>('range');
  const [lowerBound, setLowerBound] = useState<number | null>(1);
  const [upperBound, setUpperBound] = useState<number | null>(200);
  const [configuredRanges, setConfiguredRanges] = useState<Record<string, string[]>>({ 'abtest-metric': defaultRanges });

  const selectedFeatures = featureOptions.filter((item) => savedFeatureIds.includes(item.id));
  const draftFeatures = featureOptions.filter((item) => draftFeatureIds.includes(item.id));
  const filteredFeatures = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return keyword ? featureOptions.filter((item) => item.label.toLowerCase().includes(keyword)) : featureOptions;
  }, [search]);
  const activeValueFeature = featureOptions.find((item) => item.id === valueFeatureId) ?? null;
  const activeValueOptions = valueFeatureId ? valueOptionsByFeature[valueFeatureId] ?? allCandidates : [];
  const filteredValueOptions = activeValueOptions.filter((value) => value.toLowerCase().includes(valueSearch.trim().toLowerCase()));
  const addDirty = !sameValues(draftFeatureIds, savedFeatureIds);
  const valueDirty = valueFeatureId
    ? !sameValues(draftValues, featureValues[valueFeatureId] ?? [])
      || draftShowOther !== Boolean(showOtherByFeature[valueFeatureId])
      || draftValueSelectionMode !== (valueSelectionModeByFeature[valueFeatureId] ?? 'multiple')
    : false;

  const openAddFeature = () => {
    setDraftFeatureIds(savedFeatureIds); setSearch(''); setNormalExpanded(savedFeatureIds.length > 0);
    setAddAbandonOpen(false); setAddDrawerOpen(true);
  };
  const toggleDraftFeature = (id: string, checked: boolean) => {
    setDraftFeatureIds((current) => checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id));
  };
  const saveFeatures = () => {
    setSavingFeatures(true);
    window.setTimeout(() => { setSavedFeatureIds(draftFeatureIds); setSavingFeatures(false); setAddDrawerOpen(false); }, 650);
  };
  const requestAddClose = () => addDirty ? setAddAbandonOpen(true) : setAddDrawerOpen(false);
  const openValuePicker = (featureId: string) => {
    setValueFeatureId(featureId); setValueSearch(''); setDraftValues(featureValues[featureId] ?? []);
    setDraftValueSelectionMode(valueSelectionModeByFeature[featureId] ?? 'multiple');
    setDraftShowOther(Boolean(showOtherByFeature[featureId])); setValueAbandonOpen(false);
  };
  const closeValuePicker = () => { setValueFeatureId(null); setValueAbandonOpen(false); };
  const requestValueClose = () => valueDirty ? setValueAbandonOpen(true) : closeValuePicker();
  const saveValuePicker = () => {
    if (!valueFeatureId) return;
    setFeatureValues((current) => ({ ...current, [valueFeatureId]: draftValues }));
    setValueSelectionModeByFeature((current) => ({ ...current, [valueFeatureId]: draftValueSelectionMode }));
    setShowOtherByFeature((current) => ({ ...current, [valueFeatureId]: draftShowOther }));
    closeValuePicker();
  };
  const openCtmdEditor = () => {
    setDraftMode(savedMode); setDraftCandidates(savedCandidates); setDraftCtmdShowOther(savedShowOther);
    setConfirmOpen(false); setCtmdDrawerOpen(true);
  };
  const confirmSingle = () => { setDraftMode('single'); setDraftCtmdShowOther(false); setConfirmOpen(false); };
  const saveCtmdEditor = () => {
    setSavedMode(draftMode); setSavedCandidates(draftCandidates); setSavedShowOther(draftCtmdShowOther);
    if (draftMode === 'single' && !draftCandidates.includes(applicationValue)) setApplicationValue(draftCandidates[0] ?? '');
    setCtmdDrawerOpen(false);
  };
  const saveNumberSettings = (featureId: string) => {
    const low = lowerBound ?? 0; const high = upperBound ?? low + 1;
    const values = numberMode === 'range'
      ? [String(low) + ' 以下', String(low) + '-' + String(high), String(high) + ' 以上']
      : [String(low), String(high)];
    setConfiguredRanges((current) => ({ ...current, [featureId]: values })); setSettingsFeatureId(null);
  };
  const getDisplayMode = (featureId: string): FeatureDisplayMode => {
    if (configuredRanges[featureId]) return 'range-options';
    return featureDisplayModeById[featureId] ?? 'missing-range';
  };
  const iconButton = (name: 'edit' | 'delete' | 'setting' | 'close', label: string, onClick?: () => void) => (
    <SensButton className="icon-action" tone="linkWeak" icon={<SensIcon name={name} sizeToken="size/icon/m" colorRole="inherit" />}
      aria-label={label} title={label} onClick={onClick} />
  );
  const settingsPopover = (feature: FeatureOption) => (
    <SensPopover open={settingsFeatureId === feature.id}
      onOpenChange={(open) => setSettingsFeatureId(open ? feature.id : null)}
      variant="action" size="medium" placement="left" title="选项设置"
      content={
        <div className="number-setting-panel">
          <SensRadioGroup aria-label="数值展示方式" value={numberMode}
            onChange={(value) => setNumberMode(value as NumberMode)}
            options={[{ value: 'range', label: '使用区间' }, { value: 'discrete', label: '使用离散数字' }]} />
          <p className="setting-helper">{numberMode === 'range' ? '按边界值生成连续区间，模板应用时可直接勾选区间。' : '离散数字会作为独立选项展示，不生成连续区间。'}</p>
          <div className="number-setting-row">
            <SensInputNumber value={lowerBound} onChange={(value) => setLowerBound(typeof value === 'number' ? value : null)} />
            {numberMode === 'range' ? <span>至</span> : null}
            <SensInputNumber value={upperBound} onChange={(value) => setUpperBound(typeof value === 'number' ? value : null)} />
          </div>
          {numberMode === 'range' ? <SensButton tone="link">添加区间</SensButton> : null}
          <SensButton tone="linkWeak" onClick={() => { setLowerBound(1); setUpperBound(200); }}>重置为默认区间</SensButton>
        </div>
      }
      actions={<><SensButton tone="secondary" onClick={() => setSettingsFeatureId(null)}>取消</SensButton>
        <SensButton tone="primary" onClick={() => saveNumberSettings(feature.id)}>确定</SensButton></>}>
      {iconButton('setting', '设置 ' + feature.label, () => setSettingsFeatureId(feature.id))}
    </SensPopover>
  );

  return (
    <>
      <SensProductShell layout="vertical" contentLabel="创建实体筛选特征模板"
        topNavigation={<SensTopNavigation embedded activeNavLabel="标签管理" items={topNavigationItems} />}
        titleBar={<SensPageTitleBar variant="drilldown" title="创建模板"
          breadcrumbItems={[{ key: 'settings', label: '基本设置' }, { key: 'feature-template', label: '实体筛选特征模板' }, { key: 'create-template', label: '创建模板' }]}
          onBack={() => undefined}
          actions={<><SensButton tone="secondary">放弃</SensButton>
            <SensButton tone="primary" disabled={!templateName.trim() || savedFeatureIds.length === 0}>提交</SensButton></>} />}>
        <main className="template-page">
          <section className="page-section" aria-labelledby="basic-title">
            <SensSectionTitle id="basic-title" title="基础信息" size="large" />
            <div className="basic-form-wrap">
              <SensForm layout="vertical">
                <SensFormItem label="所属实体" labelHelp="模板适用的数据实体" required>
                  <SensSelectDropdown value={entity} onChange={(value) => setEntity(String(value))}
                    options={[{ value: 'user', label: '用户' }, { value: 'store', label: '门店' }]} style={{ width: '100%' }} />
                </SensFormItem>
                <SensFormItem label="模板名称" required counter={String(templateName.length) + '/60'}>
                  <SensInput value={templateName} maxLength={60} onChange={(event) => setTemplateName(event.target.value)} />
                </SensFormItem>
                <SensFormItem label="备注" optional="(选填)">
                  <SensTextArea value={remark} placeholder="请输入备注" maxLength={200} onChange={(event) => setRemark(event.target.value)} />
                </SensFormItem>
              </SensForm>
            </div>
          </section>
          <section className="page-section" aria-labelledby="detail-title">
            <SensSectionTitle id="detail-title" title="模板详情" size="large" />
            <div className="feature-builder">
              <div className="feature-group-card">
                <div className="feature-group-card__header">
                  <div className="group-title"><SensIcon name="drag-vertical" sizeToken="size/icon/m" colorRole="subtle" />
                    <strong>特征组1</strong>{iconButton('edit', '编辑特征组名称')}</div>
                  {iconButton('delete', '删除特征组')}
                </div>
                {selectedFeatures.length > 0 ? <div className="feature-list">
                  {selectedFeatures.map((feature) => {
                    const displayMode = getDisplayMode(feature.id);
                    const values = featureValues[feature.id] ?? [];
                    const expanded = expandedValueRows.includes(feature.id);
                    const visibleValues = expanded ? values : values.slice(0, 4);
                    const ranges = configuredRanges[feature.id] ?? [];
                    return <div className={'feature-item feature-item--' + displayMode} key={feature.id}>
                      <div className="feature-item__identity">
                        <span className="feature-item__name" title={feature.label}>{feature.label}</span>
                        {feature.description ? <span className="feature-item__description">{feature.description}</span> : null}
                        {iconButton('edit', '编辑 ' + feature.label)}
                      </div>
                      <div className="feature-item__configuration">
                        {displayMode === 'missing-range' ? <SensButton tone="dangerLinkWeak" onClick={() => setSettingsFeatureId(feature.id)}>暂无默认区间，点击右侧设置</SensButton> : null}
                        {displayMode === 'operator-value' ? <>
                          <SensSelectDropdown value="equals" widthPreset="128"
                            options={[{ value: 'equals', label: '等于' }, { value: 'not-equals', label: '不等于' }, { value: 'contains', label: '包含' }]} />
                          {values.length === 0 ? <SensButton tone="link" onClick={() => openValuePicker(feature.id)}>添加特征值</SensButton>
                            : <div className="inline-values" role="group" aria-label={feature.label + ' 已选特征值'}>
                              {visibleValues.map((value) => <SensCheckbox key={value} readOnly>{value}</SensCheckbox>)}
                              {showOtherByFeature[feature.id] ? <SensCheckbox readOnly>其他</SensCheckbox> : null}
                              {values.length > 4 ? <SensButton tone="linkWeak"
                                onClick={() => setExpandedValueRows((current) => expanded ? current.filter((id) => id !== feature.id) : [...current, feature.id])}>
                                {expanded ? '收起' : '更多'}</SensButton> : null}
                            </div>}
                        </> : null}
                        {displayMode === 'range-options' ? <div className="feature-range-options" role="group" aria-label={feature.label + ' 默认区间'}>
                          {ranges.map((range) => <SensCheckbox key={range} readOnly>{range}</SensCheckbox>)}
                          {ranges.length > 5 ? <SensButton tone="linkWeak">更多</SensButton> : null}
                        </div> : null}
                        {displayMode === 'selection-mode' ? <div className="feature-selection-setting">
                          <span>应用选择方式</span><span>{savedMode === 'single' ? '单选' : '多选'}</span>
                          <SensButton tone="link" onClick={openCtmdEditor}>编辑值</SensButton>
                        </div> : null}
                      </div>
                      <div className="feature-item__actions">
                        {displayMode === 'missing-range' || displayMode === 'range-options' ? settingsPopover(feature) : null}
                        {displayMode === 'operator-value' && values.length > 0 ? iconButton('setting', '编辑特征值 ' + feature.label, () => openValuePicker(feature.id)) : null}
                        <span className="row-remove">{iconButton('close', '移除 ' + feature.label, () => setSavedFeatureIds((current) => current.filter((item) => item !== feature.id)))}</span>
                      </div>
                    </div>;
                  })}
                </div> : null}
                <SensButton className="full-dashed-action" tone="dashed" onClick={openAddFeature}>添加特征</SensButton>
              </div>
              <SensButton className="full-dashed-action" tone="dashed">添加特征组</SensButton>
              <SensButton tone="dashed">添加黑名单范围</SensButton>
              <p className="helper-copy">使用模板时可以选择上述分群，将其排除在筛选结果之外</p>
            </div>
          </section>
          {savedFeatureIds.includes('ctmd') ? <section className="page-section application-section" aria-labelledby="application-title">
            <SensSectionTitle id="application-title" title="模板应用效果" size="large" />
            <div className="application-content"><span className="application-feature-name">Exclusion Rules for CTMD</span>
              <span>信贷分期业务排除规则</span>
              {savedMode === 'single'
                ? <SensRadioGroup aria-label="应用态单选值" options={savedCandidates.map((value) => ({ value, label: value }))} value={applicationValue} onChange={setApplicationValue} />
                : <div className="application-checkboxes">{savedCandidates.map((value) => <SensCheckbox key={value} checked readOnly>{value}</SensCheckbox>)}
                  {savedShowOther ? <SensCheckbox readOnly>其他</SensCheckbox> : null}</div>}
            </div>
          </section> : null}
        </main>
      </SensProductShell>

      <SensDrawer open={addDrawerOpen} size="medium" onClose={requestAddClose} bodyStyle={{ padding: '16px 24px 24px' }}
        titleBar={<SensTitleBar title="添加特征" onBack={requestAddClose} actions={<>
          {addDirty ? <SensPopover open={addAbandonOpen} onOpenChange={setAddAbandonOpen} variant="confirm" size="small"
            placement="bottom" align="end" title="确定放弃此次添加吗？" content="放弃后，本次已选择的特征不会保存。"
            actions={<><SensButton tone="dangerSecondary" onClick={() => { setAddAbandonOpen(false); setAddDrawerOpen(false); }}>确定放弃</SensButton>
              <SensButton tone="primary" onClick={() => setAddAbandonOpen(false)}>继续添加</SensButton></>}>
            <SensButton tone="secondary">放弃</SensButton>
          </SensPopover> : <SensButton tone="secondary" onClick={() => setAddDrawerOpen(false)}>放弃</SensButton>}
          <SensButton tone="primary" loading={savingFeatures} disabled={draftFeatureIds.length === 0} onClick={saveFeatures}>保存</SensButton>
        </>} />}>
        <div className="feature-picker">
          <section className="feature-picker__source" aria-label="可选特征">
            <SearchInput visualVariant="minimal" style={{ width: '100%' }} value={search} placeholder="请输入搜索内容" onChange={(event) => setSearch(event.target.value)} />
            <div className="source-count">共 426 条数据</div>
            <div className="feature-tree">
              <button className="tree-group-button" type="button" aria-expanded={normalExpanded} onClick={() => setNormalExpanded((current) => !current)}>
                <SensIcon name={normalExpanded ? 'chevron-down' : 'chevron-right'} sizeToken="size/icon/m" colorRole="subtle" />
                <SensCheckbox checked={draftFeatureIds.length > 0 && draftFeatureIds.length === featureOptions.length}
                  indeterminate={draftFeatureIds.length > 0 && draftFeatureIds.length < featureOptions.length}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => { setDraftFeatureIds(event.target.checked ? featureOptions.map((item) => item.id) : []); setNormalExpanded(true); }} />
                <span>普通属性</span>
              </button>
              {normalExpanded || search ? <div className="tree-options">{filteredFeatures.map((item) =>
                <SensCheckbox key={item.id} checked={draftFeatureIds.includes(item.id)}
                  onChange={(event) => toggleDraftFeature(item.id, event.target.checked)}>{item.label}</SensCheckbox>)}</div> : null}
              <button className="tree-group-button" type="button"><SensIcon name="chevron-right" sizeToken="size/icon/m" colorRole="subtle" />
                <SensCheckbox onClick={(event) => event.stopPropagation()} /><span>标签</span></button>
            </div>
            <div className="picker-footer"><SensCheckbox
              checked={draftFeatureIds.length > 0 && draftFeatureIds.length === featureOptions.length}
              indeterminate={draftFeatureIds.length > 0 && draftFeatureIds.length < featureOptions.length}
              onChange={(event) => { setDraftFeatureIds(event.target.checked ? featureOptions.map((item) => item.id) : []); setNormalExpanded(true); }}>全选</SensCheckbox></div>
          </section>
          <section className="feature-picker__selected" aria-label="已选特征">
            {draftFeatures.length === 0 ? <SensEmptyState scope="non-page" type="noData" title="暂无数据" description="请从左侧列表内选择" style={{ margin: 'auto' }} />
              : <div className="selected-feature-list">{draftFeatures.map((feature) => <div className="selected-feature" key={feature.id}>
                <SensIcon name="drag-vertical" sizeToken="size/icon/m" colorRole="subtle" /><span>{feature.label}</span>
                {iconButton('close', '删除 ' + feature.label, () => toggleDraftFeature(feature.id, false))}</div>)}</div>}
            <div className="picker-footer selected-footer"><SensButton tone="linkWeak" onClick={() => setDraftFeatureIds([])}>清空</SensButton>
              <span>已选 {draftFeatureIds.length} 条</span></div>
          </section>
        </div>
      </SensDrawer>

      <SensDrawer open={Boolean(valueFeatureId)} size="medium" onClose={requestValueClose} bodyStyle={{ padding: 0 }}
        titleBar={<SensTitleBar title={'添加特征值 - ' + (activeValueFeature?.label ?? '')} onBack={requestValueClose} actions={<>
          {valueDirty ? <SensPopover open={valueAbandonOpen} onOpenChange={setValueAbandonOpen} variant="confirm" size="small"
            placement="bottom" align="end" title="确定放弃此次添加吗？" content="放弃后，本次已选择的特征值不会保存。"
            actions={<><SensButton tone="dangerSecondary" onClick={closeValuePicker}>确定放弃</SensButton>
              <SensButton tone="primary" onClick={() => setValueAbandonOpen(false)}>继续添加</SensButton></>}>
            <SensButton tone="secondary">放弃</SensButton>
          </SensPopover> : <SensButton tone="secondary" onClick={closeValuePicker}>放弃</SensButton>}
          <SensButton tone="primary" disabled={draftValues.length === 0 && !draftShowOther} onClick={saveValuePicker}>保存</SensButton>
        </>} />}>
        <div className="value-picker-page">
          <section className="value-picker-field" aria-labelledby="display-mode-label">
            <h3 id="display-mode-label">展示方式</h3>
            <SensRadioGroup aria-label="展示方式" value={draftValueSelectionMode}
              onChange={(value) => setDraftValueSelectionMode(value as SelectionMode)}
              options={[{ value: 'single', label: '单选' }, { value: 'multiple', label: '多选' }]} />
          </section>
          <section className="value-picker-field value-picker-field--fill" aria-labelledby="select-value-label">
            <h3 id="select-value-label">选择特征值</h3>
            <div className="value-picker-guidance"><span>选择左侧「特征 ID」，使用模板的可以直接勾选</span>
              <SensCheckbox checked={draftShowOther} onChange={(event) => setDraftShowOther(event.target.checked)}>其他（未勾选或未显示特征值）</SensCheckbox></div>
            <div className="feature-picker value-picker">
              <section className="feature-picker__source" aria-label="可选特征值">
                <SearchInput visualVariant="minimal" style={{ width: '100%' }} value={valueSearch} placeholder="搜索" onChange={(event) => setValueSearch(event.target.value)} />
                <div className="source-count">共 {activeValueOptions.length} 个</div>
                <div className="value-option-list">{filteredValueOptions.map((value) => <SensCheckbox key={value}
                  checked={draftValues.includes(value)}
                  onChange={(event) => setDraftValues((current) => event.target.checked ? Array.from(new Set([...current, value])) : current.filter((item) => item !== value))}>{value}</SensCheckbox>)}</div>
                <div className="picker-footer"><SensCheckbox checked={draftValues.length > 0 && draftValues.length === activeValueOptions.length}
                  indeterminate={draftValues.length > 0 && draftValues.length < activeValueOptions.length}
                  onChange={(event) => setDraftValues(event.target.checked ? activeValueOptions : [])}>全选</SensCheckbox></div>
              </section>
              <section className="feature-picker__selected" aria-label="已选特征值">
                {draftValues.length === 0 ? <SensEmptyState scope="non-page" type="noData" title="暂无数据" description="请从左侧列表内选择" style={{ margin: 'auto' }} />
                  : <div className="selected-feature-list">{draftValues.map((value) => <div className="selected-feature" key={value}>
                    <SensIcon name="drag-vertical" sizeToken="size/icon/m" colorRole="subtle" /><span>{value}</span>
                    {iconButton('close', '删除 ' + value, () => setDraftValues((current) => current.filter((item) => item !== value)))}</div>)}</div>}
                <div className="picker-footer selected-footer"><SensButton tone="linkWeak" onClick={() => setDraftValues([])}>清空</SensButton>
                  <span>已选 {draftValues.length} 个</span></div>
              </section>
            </div>
          </section>
        </div>
      </SensDrawer>

      <SensDrawer open={ctmdDrawerOpen} size="medium" onClose={() => setCtmdDrawerOpen(false)}
        titleBar={<SensTitleBar title="特征值配置" onBack={() => setCtmdDrawerOpen(false)}
          actions={<><SensButton tone="secondary" onClick={() => setCtmdDrawerOpen(false)}>放弃</SensButton>
            <SensButton tone="primary" onClick={saveCtmdEditor}>保存</SensButton></>} />}>
        <div className="value-editor"><SensSectionTitle title="应用规则配置" size="large" />
          <SensForm layout="horizontal" labelWidth={132}>
            <SensFormItem label="应用选择方式" name="selectionMode">
              <div className="selection-mode-row" role="radiogroup" aria-label="应用选择方式">
                <SensPopover open={confirmOpen} onOpenChange={setConfirmOpen} variant="confirm" size="medium" placement="bottom"
                  title="显示方式切换确认"
                  content="切换为单选后，应用该模板创建或编辑分群时，每个特征只能选择一个特征值。已存在多个已选值的历史分群进入编辑时，将默认不选，需用户重新选择。是否确认切换？"
                  actions={<><SensButton tone="secondary" onClick={() => setConfirmOpen(false)}>暂不切换</SensButton>
                    <SensButton tone="primary" onClick={confirmSingle}>确认切换</SensButton></>}>
                  <SensRadio name="selectionMode" value="single" checked={draftMode === 'single'}
                    onChange={() => draftMode !== 'single' && setConfirmOpen(true)}>单选</SensRadio>
                </SensPopover>
                <SensRadio name="selectionMode" value="multiple" checked={draftMode === 'multiple'}
                  onChange={() => { setConfirmOpen(false); setDraftMode('multiple'); }}>多选</SensRadio>
              </div>
            </SensFormItem>
            <SensFormItem label="其他值展示" name="showOther">
              <SensCheckbox checked={draftCtmdShowOther} disabled={draftMode === 'single'}
                description={draftMode === 'single' ? '仅多选支持' : undefined}
                onChange={(event) => setDraftCtmdShowOther(event.target.checked)}>展示“其他”</SensCheckbox>
            </SensFormItem>
            <SensFormItem label="候选值" name="candidateValues">
              <div className="candidate-value-list">{allCandidates.map((value) => <SensCheckbox key={value}
                checked={draftCandidates.includes(value)}
                onChange={(event) => setDraftCandidates((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))}>{value}</SensCheckbox>)}</div>
            </SensFormItem>
          </SensForm>
        </div>
      </SensDrawer>
    </>
  );
}
