import { useMemo, useState, type DragEvent } from 'react';
import {
  SensButton,
  SensCheckbox,
  SensEmptyState,
  SensForm,
  SensFormItem,
  SensIcon,
  SensInput,
  SensInputNumber,
  SensRadioGroup,
  SensSectionTitle,
  SensSelectDropdown,
  SensTextArea,
} from '@sens/prototype-kit';
import kafkaIcon from '../assets/kafka-mark-dark.png';
import { MappingRelationGraphic } from './MappingRelationGraphic';
import {
  SCHEMA_OPTIONS,
  SOURCE_CONNECTIONS,
  SOURCE_DATA,
  SOURCE_FIELDS,
  TARGET_FIELDS,
  TARGET_DATA_OPTIONS,
  type TaskDraft,
} from '../domain';

export interface FormErrors {
  name?: string;
  sourceConnection?: string;
  sourceData?: string;
  schema?: string;
  targetData?: string;
  userKeySource?: string;
  userKeyTarget?: string;
  mappings?: string;
  runImmediately?: string;
  timestamp?: string;
  offset?: string;
  parallelism?: string;
  alarmRestart?: string;
  alarmInvalid?: string;
}

interface StreamTaskFormProps {
  mode: 'create' | 'edit' | 'copy';
  draft: TaskDraft;
  errors: FormErrors;
  quotaFull: boolean;
  onChange: (draft: TaskDraft) => void;
}

const anchors = [
  { id: 'basic-info', label: '任务基本信息' },
  { id: 'source-target', label: '数据来源和目标' },
  { id: 'execution-rules', label: '任务执行规则' },
  { id: 'alarm-monitor', label: '报警监控' },
];

export function StreamTaskForm({ mode, draft, errors, quotaFull, onChange }: StreamTaskFormProps) {
  const [activeAnchor, setActiveAnchor] = useState('basic-info');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(true);
  const sourceReadOnly = mode === 'edit';
  const sourceDataOptions = SOURCE_DATA[draft.sourceConnection] ?? [];
  const schemaOptions = SCHEMA_OPTIONS[draft.sourceData] ?? [];
  const hasConnectionError = draft.sourceConnection === 'hdfs-error';
  const sourceTargetReady = Boolean(draft.schema && (draft.standardJson || draft.targetData));
  const hashCandidates = useMemo(
    () => SOURCE_FIELDS.filter((field) => !draft.hashFields.includes(field.value)),
    [draft.hashFields],
  );

  const patch = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => onChange({ ...draft, [key]: value });
  const goTo = (id: string) => {
    setActiveAnchor(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const changeConnection = (value: string) => {
    const errored = value === 'hdfs-error';
    onChange({
      ...draft,
      sourceConnection: value,
      sourceData: '',
      schema: '',
      standardJson: false,
      targetData: '',
      userKeySource: '',
      userKeyTarget: '',
      mappings: [{ id: 'mapping-1', source: '', target: '' }],
      ...(errored ? {} : {}),
    });
  };

  const changeSourceData = (value: string) => {
    const option = sourceDataOptions.find((item) => item.value === value);
    onChange({
      ...draft,
      sourceData: value,
      schema: '',
      standardJson: Boolean(option?.standardJson),
      targetData: option?.standardJson ? 'auto-events' : '',
      userKeySource: '',
      userKeyTarget: '',
    });
  };

  const changeSchema = (value: string) => {
    const standardJson = value === 'standard-schema';
    onChange({
      ...draft,
      schema: value,
      standardJson,
      targetData: standardJson ? 'auto-events' : draft.targetData === 'auto-events' ? '' : draft.targetData,
    });
  };

  const updateMapping = (id: string, key: 'source' | 'target', value: string) => {
    patch('mappings', draft.mappings.map((item) => item.id === id ? { ...item, [key]: value } : item));
  };

  const addMapping = () => {
    const next = draft.mappings.length + 1;
    patch('mappings', [...draft.mappings, { id: 'mapping-' + next, source: '', target: '' }]);
  };

  const addHashField = () => {
    const next = hashCandidates[0];
    if (next) patch('hashFields', [...draft.hashFields, next.value]);
  };

  const reorderHashField = (from: string, to: string) => {
    if (from === to) return;
    const fields = [...draft.hashFields];
    const fromIndex = fields.indexOf(from);
    const toIndex = fields.indexOf(to);
    fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, from);
    patch('hashFields', fields);
  };

  return (
    <main className="task-form-page" data-testid={mode + '-task-form'}>
      {mode === 'edit' ? (
        <div className="schema-warning" role="alert">
          <SensIcon name="feedback-error" />
          <span>字段变更或被删除，请检查来源数据表或 Schema 后重试</span>
        </div>
      ) : null}

      <div className="task-form-layout">
        <div className="task-form-content">
          <section id="basic-info" className="form-section" aria-labelledby="basic-info-title">
            <SensSectionTitle id="basic-info-title" title="任务基本信息" size="large" />
            <SensForm layout="horizontal" labelWidth={76}>
              <SensFormItem label="任务名称" required error={errors.name}>
                <SensInput
                  value={draft.name}
                  maxLength={100}
                  placeholder="请输入"
                  status={errors.name ? 'error' : undefined}
                  onChange={(event) => patch('name', event.target.value)}
                />
              </SensFormItem>
              <SensFormItem label="描述" optional="(选填)" counter={draft.description.length + '/200'}>
                <SensTextArea
                  value={draft.description}
                  maxLength={200}
                  placeholder="请输入"
                  onChange={(event) => patch('description', event.target.value)}
                />
              </SensFormItem>
            </SensForm>
          </section>

          <section id="source-target" className="form-section" aria-labelledby="source-target-title">
            <SensSectionTitle id="source-target-title" title="数据来源和目标" size="large" />
            <div className="source-target-grid">
              <div className="source-target-column">
                <h3>数据同步来源</h3>
                <div className="source-card">
                  <SensForm layout="horizontal" labelWidth={72}>
                    <SensFormItem
                      label="来源连接"
                      required
                      error={errors.sourceConnection || (hasConnectionError ? '数据连接异常，请检查参数后重试' : undefined)}
                      controlExtra={hasConnectionError ? (
                        <SensButton tone="link" disabled title="当前原型暂不支持连接详情">查看详情</SensButton>
                      ) : undefined}
                    >
                      {sourceReadOnly ? (
                        <SensInput readOnlyVariant="plain" value={SOURCE_CONNECTIONS.find((item) => item.value === draft.sourceConnection)?.label ?? draft.sourceConnection} />
                      ) : (
                        <SensSelectDropdown
                          value={draft.sourceConnection || undefined}
                          onChange={(value) => changeConnection(String(value))}
                          placeholder="请选择来源连接"
                          status={hasConnectionError || errors.sourceConnection ? 'error' : undefined}
                          options={SOURCE_CONNECTIONS.map((item) => ({
                            ...item,
                            icon: <img className="source-icon" src={kafkaIcon} alt="" />,
                          }))}
                          style={{ width: '100%' }}
                        />
                      )}
                    </SensFormItem>
                    <SensFormItem label="来源数据" required error={errors.sourceData}>
                      {sourceReadOnly ? (
                        <SensInput readOnlyVariant="plain" value={sourceDataOptions.find((item) => item.value === draft.sourceData)?.label ?? draft.sourceData} />
                      ) : (
                        <SensSelectDropdown
                          value={draft.sourceData || undefined}
                          onChange={(value) => changeSourceData(String(value))}
                          placeholder="请选择来源侧数据"
                          disabled={!draft.sourceConnection || hasConnectionError}
                          options={sourceDataOptions}
                          style={{ width: '100%' }}
                        />
                      )}
                    </SensFormItem>
                    <SensFormItem
                      label="Schema"
                      required
                      error={errors.schema}
                      controlExtra={<SensButton tone="link" disabled title="当前原型暂不支持 Schema 管理">Schema 管理</SensButton>}
                    >
                      {sourceReadOnly ? (
                        <div className="readonly-with-status">
                          <SensInput readOnlyVariant="plain" value={schemaOptions.find((item) => item.value === draft.schema)?.label ?? draft.schema} />
                          {mode === 'edit' ? <SensIcon name="feedback-error" /> : null}
                        </div>
                      ) : (
                        <SensSelectDropdown
                          value={draft.schema || undefined}
                          onChange={(value) => changeSchema(String(value))}
                          placeholder="请选择 Schema"
                          disabled={!draft.sourceData}
                          options={schemaOptions}
                          style={{ width: '100%' }}
                        />
                      )}
                    </SensFormItem>
                  </SensForm>
                </div>
              </div>

              <div className="relation-line" aria-hidden>
                <MappingRelationGraphic withLines />
              </div>

              <div className="source-target-column">
                <h3>数据同步目标</h3>
                <div className="source-card">
                  <SensForm layout="horizontal" labelWidth={72}>
                    <SensFormItem label="目标类型">
                      <SensRadioGroup value="entity" readOnly options={[{ value: 'entity', label: '实体' }]} />
                    </SensFormItem>
                    <SensFormItem label="目标数据" required error={errors.targetData}>
                      {sourceReadOnly ? (
                        <SensInput
                          readOnlyVariant="plain"
                          value={TARGET_DATA_OPTIONS.find((option) => option.value === draft.targetData)?.label ?? draft.targetData}
                        />
                      ) : (
                        <SensSelectDropdown
                          value={draft.targetData || undefined}
                          onChange={(value) => patch('targetData', String(value))}
                          placeholder="请选择目标侧数据"
                          disabled={!draft.schema || draft.standardJson}
                          options={TARGET_DATA_OPTIONS}
                          style={{ width: '100%' }}
                        />
                      )}
                    </SensFormItem>
                  </SensForm>
                  {draft.standardJson ? (
                    <p className="inline-tip">“神策标准 JSON 格式”数据，无需配置同步目标和字段映射</p>
                  ) : null}
                </div>
              </div>
            </div>

            {sourceTargetReady ? <div className="mapping-section">
              <button
                type="button"
                className="collapse-trigger"
                aria-expanded={mappingOpen}
                onClick={() => setMappingOpen((value) => !value)}
              >
                <SensIcon name={mappingOpen ? 'down' : 'right'} />字段映射
              </button>
              {mappingOpen ? (
                draft.standardJson ? (
                  <div className="standard-json-note">“神策标准 JSON 格式”数据，无需配置同步目标和字段映射</div>
                ) : (
                  <div className="mapping-panel">
                  <div className="mapping-group">
                    <h4>用户标识字段</h4>
                    <div className="mapping-row">
                      <SensSelectDropdown
                        value={draft.userKeySource || undefined}
                        placeholder="请选择用户标识字段"
                        disabled={!draft.schema}
                        status={errors.userKeySource ? 'error' : undefined}
                        options={SOURCE_FIELDS}
                        onChange={(value) => patch('userKeySource', String(value))}
                        style={{ width: '100%' }}
                      />
                      <span className="mapping-relation"><MappingRelationGraphic /></span>
                      <SensSelectDropdown
                        value={draft.userKeyTarget || undefined}
                        placeholder="请选择用户标识字段"
                        disabled={!draft.targetData}
                        status={errors.userKeyTarget ? 'error' : undefined}
                        options={TARGET_FIELDS}
                        onChange={(value) => patch('userKeyTarget', String(value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    {errors.userKeySource || errors.userKeyTarget ? (
                      <span className="field-error">{errors.userKeySource ?? errors.userKeyTarget}</span>
                    ) : null}
                  </div>
                  <div className="mapping-group">
                    <h4>标签值字段映射</h4>
                    <div className="mapping-actions">
                      <SensButton tone="secondary" onClick={addMapping}>添加映射关系</SensButton>
                      <SensButton tone="linkWeak" disabled title="当前原型暂不支持批量操作">批量操作</SensButton>
                    </div>
                    {draft.mappings.map((mapping, index) => (
                      <div className="mapping-entry" key={mapping.id}>
                        <span className="mapping-entry__label">标签 {index + 1}</span>
                        <div className="mapping-row">
                          <SensSelectDropdown
                            value={mapping.source || undefined}
                            placeholder="请选择标签值字段"
                            status={errors.mappings ? 'error' : undefined}
                            options={SOURCE_FIELDS}
                            onChange={(value) => updateMapping(mapping.id, 'source', String(value))}
                            style={{ width: '100%' }}
                          />
                          <span className="mapping-relation"><MappingRelationGraphic /></span>
                          <SensSelectDropdown
                            value={mapping.target || undefined}
                            placeholder="请选择标签值字段"
                            status={errors.mappings ? 'error' : undefined}
                            options={TARGET_FIELDS}
                            onChange={(value) => updateMapping(mapping.id, 'target', String(value))}
                            style={{ width: '100%' }}
                          />
                          <SensButton
                            aria-label={'删除映射 ' + (index + 1)}
                            tone="dangerLinkWeak"
                            disabled={draft.mappings.length === 1}
                            onClick={() => patch('mappings', draft.mappings.filter((item) => item.id !== mapping.id))}
                          >
                            <SensIcon name="close" />
                          </SensButton>
                        </div>
                      </div>
                    ))}
                    {errors.mappings ? <span className="field-error">{errors.mappings}</span> : null}
                  </div>
                  </div>
                )
              ) : null}
            </div> : null}
          </section>

          <section id="execution-rules" className="form-section" aria-labelledby="execution-rules-title">
            <SensSectionTitle id="execution-rules-title" title="任务执行规则" size="large" />
            {sourceTargetReady ? <div className="execution-form">
              <div className="read-row"><span>执行计划</span><strong>长期执行</strong></div>
              <div className="read-row"><span>执行频率</span><strong>长期执行</strong></div>
              <div className="boxed-row">
                <span>提交任务后立即运行</span>
                <SensRadioGroup
                  value={draft.runImmediately ? 'yes' : 'no'}
                  onChange={(value) => patch('runImmediately', value === 'yes')}
                  options={[{ value: 'yes', label: '是', disabled: quotaFull }, { value: 'no', label: '否' }]}
                />
                {quotaFull ? <span className="field-error">无可用配额，如需继续增加，请联系客户成功经理</span> : null}
              </div>
              <div className="read-row"><span>生效周期</span><strong>长期有效</strong></div>
              <div className="read-row read-row--top">
                <span>首次消费起始</span>
                <div className="consume-start">
                  <SensRadioGroup
                    value={draft.consumeStart}
                    disabled={mode === 'edit'}
                    onChange={(value) => patch('consumeStart', value as TaskDraft['consumeStart'])}
                    options={[
                      { value: 'earliest', label: '从最早位置开始消费' },
                      { value: 'latest', label: '从最新位置开始消费' },
                      { value: 'timestamp', label: '时间戳' },
                      { value: 'offset', label: '特定偏移量' },
                    ]}
                  />
                  {draft.consumeStart === 'timestamp' ? (
                    <SensFormItem label="目标时间戳" error={errors.timestamp}>
                      <div className="number-with-unit">
                        <SensInputNumber min={0} value={draft.timestamp} onChange={(value) => patch('timestamp', typeof value === 'number' ? value : null)} />
                        <span>毫秒</span>
                      </div>
                    </SensFormItem>
                  ) : null}
                  {draft.consumeStart === 'offset' ? (
                    <SensFormItem label="偏移量" error={errors.offset}>
                      <SensInputNumber min={0} value={draft.offset} onChange={(value) => patch('offset', typeof value === 'number' ? value : null)} />
                    </SensFormItem>
                  ) : null}
                </div>
              </div>
              <div className="read-row"><span>读取逻辑</span><strong>追加更新</strong></div>
              <div className="read-row"><span>写入逻辑</span><strong>{draft.targetData.includes('event') ? '增量写入（track 逻辑）' : '更新或插入（profile_set 逻辑）'}</strong></div>
              <div className="read-row read-row--top">
                <span>分区规则</span>
                <div className="partition-panel">
                  <SensRadioGroup
                    value={draft.partitionMode}
                    onChange={(value) => patch('partitionMode', value as TaskDraft['partitionMode'])}
                    options={[
                      { value: 'hash', label: '按指定字段 hash' },
                      { value: 'parallel', label: '按并行度绑定' },
                    ]}
                  />
                  {draft.partitionMode === 'hash' ? (
                    <div className="hash-field-box">
                      <span>hash 字段</span>
                      <div className="hash-chips" aria-label="Hash 字段排序">
                        {draft.hashFields.map((field) => (
                          <span
                            className="hash-chip"
                            key={field}
                            draggable
                            onDragStart={(event: DragEvent<HTMLSpanElement>) => event.dataTransfer.setData('text/plain', field)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => reorderHashField(event.dataTransfer.getData('text/plain'), field)}
                          >
                            <SensIcon name="drag-vertical" />
                            {SOURCE_FIELDS.find((item) => item.value === field)?.label ?? field}
                            <button
                              type="button"
                              aria-label={'移除 ' + field}
                              disabled={draft.hashFields.length === 1}
                              onClick={() => patch('hashFields', draft.hashFields.filter((item) => item !== field))}
                            >
                              <SensIcon name="close" />
                            </button>
                          </span>
                        ))}
                        <SensButton tone="link" disabled={draft.hashFields.length >= 10 || hashCandidates.length === 0} onClick={addHashField}>
                          添加 ({draft.hashFields.length}/10)
                        </SensButton>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="read-row">
                <span>是否跳过异常数据</span>
                <SensRadioGroup
                  value={draft.skipInvalid ? 'yes' : 'no'}
                  onChange={(value) => patch('skipInvalid', value === 'yes')}
                  options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]}
                />
              </div>
              <SensButton className="advanced-trigger" tone="link" onClick={() => setAdvancedOpen((value) => !value)}>
                高级设置 <SensIcon name={advancedOpen ? 'up' : 'down'} />
              </SensButton>
              {advancedOpen ? (
                <SensForm layout="horizontal" labelWidth={126} className="advanced-form">
                  <SensFormItem
                    label="并行度"
                    error={errors.parallelism}
                    description="请依据您的资源性能合理配置，实际资源不满足该配置时将导致任务运行失败，范围（1–128）"
                  >
                    <SensInputNumber min={1} max={128} value={draft.parallelism} placeholder="请输入" onChange={(value) => patch('parallelism', typeof value === 'number' ? value : null)} />
                  </SensFormItem>
                  <SensFormItem label="优化参数" optional="(选填)" description="请填写优化参数，用于优化任务性能">
                    <SensTextArea value={draft.optimization} placeholder="请输入" onChange={(event) => patch('optimization', event.target.value)} />
                  </SensFormItem>
                  <SensFormItem label="强校验兼容">
                    <SensCheckbox
                      checked={draft.allowStrongValidationCreate}
                      onChange={(event) => patch('allowStrongValidationCreate', event.target.checked)}
                    >
                      允许在强校验下创建事件、属性
                    </SensCheckbox>
                  </SensFormItem>
                </SensForm>
              ) : null}
            </div> : (
              <SensEmptyState
                scope="non-page"
                type="noData"
                size="base"
                title="暂无数据"
                description="请先选择数据来源和目标"
              />
            )}
          </section>

          <section id="alarm-monitor" className="form-section" aria-labelledby="alarm-monitor-title">
            <SensSectionTitle id="alarm-monitor-title" title="报警监控" size="large" />
            <div className="alarm-monitor-content">
              <SensCheckbox checked={draft.alarmEnabled} onChange={(event) => patch('alarmEnabled', event.target.checked)}>开启报警</SensCheckbox>
              {draft.alarmEnabled ? (
                <div className="alarm-card">
                <div className="alarm-row">
                  <strong>报警条件</strong>
                  <div className="alarm-condition-list">
                    <label className="alarm-condition">
                      <SensCheckbox checked={draft.alarmRestartEnabled} onChange={(event) => patch('alarmRestartEnabled', event.target.checked)} aria-label="启用任务重启报警" />
                      <span>近</span>
                      <SensInputNumber min={0} value={draft.alarmWindow} placeholder="请输入" onChange={(value) => patch('alarmWindow', typeof value === 'number' ? value : null)} />
                      <span>分钟，任务重启次数大于</span>
                      <SensInputNumber min={0} value={draft.alarmRetries} placeholder="请输入" onChange={(value) => patch('alarmRetries', typeof value === 'number' ? value : null)} />
                      <span>次</span>
                    </label>
                    {errors.alarmRestart ? <span className="field-error">{errors.alarmRestart}</span> : null}
                    <label className="alarm-condition">
                      <SensCheckbox checked={draft.alarmInvalidEnabled} onChange={(event) => patch('alarmInvalidEnabled', event.target.checked)} aria-label="启用异常数据报警" />
                      <span>近</span>
                      <SensInputNumber min={0} value={draft.alarmInvalidWindow} placeholder="请输入" onChange={(value) => patch('alarmInvalidWindow', typeof value === 'number' ? value : null)} />
                      <span>分钟，跳过异常数据次数大于</span>
                      <SensInputNumber min={0} value={draft.alarmInvalidCount} placeholder="请输入" onChange={(value) => patch('alarmInvalidCount', typeof value === 'number' ? value : null)} />
                      <span>次</span>
                    </label>
                    {errors.alarmInvalid ? <span className="field-error">{errors.alarmInvalid}</span> : null}
                  </div>
                </div>
                <div className="alarm-row">
                  <strong>通知方式</strong>
                  <div className="notify-list">
                    <div><span>邮件</span><p><strong>收件地址</strong> 平台管理员 (admin)</p></div>
                    <div><span>Webhook</span><p><strong>Webhook</strong> 未配置</p></div>
                  </div>
                </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <nav className="form-anchors" aria-label="页面章节">
          {anchors.map((anchor) => (
            <button
              key={anchor.id}
              type="button"
              className={activeAnchor === anchor.id ? 'active' : ''}
              onClick={() => goTo(anchor.id)}
            >
              {anchor.label}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
