import { useState } from 'react';
import {
  SensIcon,
  SensInput,
  SensSectionTitle,
} from '@sens/prototype-kit';
import type { StreamTask } from '../domain';
import { SOURCE_FIELDS, STATUS_LABEL, TARGET_FIELDS } from '../domain';
import { MappingRelationGraphic } from './MappingRelationGraphic';

interface StreamTaskDetailProps {
  task: StreamTask;
}

const detailAnchors = [
  { id: 'detail-basic', label: '任务基本信息' },
  { id: 'detail-source', label: '数据来源和目标' },
  { id: 'detail-execution', label: '任务执行规则' },
  { id: 'detail-alarm', label: '报警监控' },
];

export function StreamTaskDetail({ task }: StreamTaskDetailProps) {
  const [activeAnchor, setActiveAnchor] = useState('detail-basic');
  const goTo = (id: string) => {
    setActiveAnchor(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="task-detail-page" data-testid="task-detail">
      {task.status === 'abnormal' ? (
        <div className="schema-warning" role="alert">
          <SensIcon name="feedback-error" />
          <span>任务运行异常：消费位点读取失败，请导出日志后检查来源连接。</span>
        </div>
      ) : null}
      <div className="detail-layout">
        <div className="detail-content">
          <section id="detail-basic" className="form-section">
            <SensSectionTitle title="任务基本信息" size="large" />
            <dl className="detail-list detail-list--basic">
              <div><dt>任务名称</dt><dd>{task.name}</dd></div>
              <div><dt>任务 ID</dt><dd>{task.id}</dd></div>
              <div><dt>任务类型</dt><dd>同步任务</dd></div>
              <div><dt>创建人</dt><dd>{task.creator}</dd></div>
              <div><dt>执行频率</dt><dd>长期执行</dd></div>
              <div><dt>任务状态</dt><dd>{STATUS_LABEL[task.status]}</dd></div>
              <div className="detail-description"><dt>描述</dt><dd className="readonly-block">{task.description || '—'}</dd></div>
            </dl>
          </section>

          <section id="detail-source" className="form-section">
            <SensSectionTitle title="数据来源和目标" size="large" />
            <div className="source-target-grid detail-source-target">
              <div className="source-target-column">
                <h3>数据同步来源</h3>
                <div className="source-card detail-card">
                  <p><strong>来源连接</strong>{task.sourceConnection}</p>
                  <p><strong>来源数据</strong>{task.sourceData}</p>
                  <p><strong>Schema</strong>{task.schema}</p>
                </div>
              </div>
              <div className="relation-line" aria-hidden><MappingRelationGraphic withLines /></div>
              <div className="source-target-column">
                <h3>数据同步目标</h3>
                <div className="source-card detail-card">
                  <p><strong>目标类型</strong>实体</p>
                  <p><strong>目标数据</strong>{task.targetData}</p>
                </div>
              </div>
            </div>
            <div className="detail-mapping">
              <button type="button" className="collapse-trigger" aria-expanded="true">
                <SensIcon name="down" />字段映射
              </button>
              {task.standardJson ? (
                <div className="standard-json-note">“神策标准 JSON 格式”数据，无需配置同步目标和字段映射</div>
              ) : (
                <div className="mapping-panel">
                  <div className="mapping-group">
                    <h4>用户标识字段</h4>
                    <div className="mapping-row mapping-row--readonly">
                      <SensInput aria-label="来源侧用户标识字段" readOnly readOnlyVariant="filled" value={fieldLabel(SOURCE_FIELDS, task.userKeySource)} />
                      <span className="mapping-relation"><MappingRelationGraphic /></span>
                      <SensInput aria-label="目标侧用户标识字段" readOnly readOnlyVariant="filled" value={fieldLabel(TARGET_FIELDS, task.userKeyTarget)} />
                    </div>
                  </div>
                  <div className="mapping-group">
                    <h4>标签值字段映射</h4>
                    {task.mappings.map((mapping) => (
                      <div className="mapping-entry" key={mapping.id}>
                        <span className="mapping-entry__label">标签 {task.mappings.indexOf(mapping) + 1}</span>
                        <div className="mapping-row mapping-row--readonly">
                          <SensInput aria-label={`标签 ${task.mappings.indexOf(mapping) + 1} 来源字段`} readOnly readOnlyVariant="filled" value={fieldLabel(SOURCE_FIELDS, mapping.source)} />
                          <span className="mapping-relation"><MappingRelationGraphic /></span>
                          <SensInput aria-label={`标签 ${task.mappings.indexOf(mapping) + 1} 目标字段`} readOnly readOnlyVariant="filled" value={fieldLabel(TARGET_FIELDS, mapping.target)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section id="detail-execution" className="form-section">
            <SensSectionTitle title="任务执行规则" size="large" />
            <dl className="detail-list detail-list--wide">
              <div><dt>执行计划</dt><dd>长期执行</dd></div>
              <div><dt>执行频率</dt><dd>长期执行</dd></div>
              <div className="detail-banner detail-banner--consume"><dt>首次消费起始</dt><dd>{consumeLabel(task.consumeStart)}</dd></div>
              <div><dt>生效周期</dt><dd>长期有效</dd></div>
              <div><dt>读取逻辑</dt><dd>追加更新</dd></div>
              <div><dt>写入逻辑</dt><dd>{task.standardJson ? '增量写入（track 逻辑）' : '更新或插入（profile_set 逻辑）'}</dd></div>
              <div><dt>分区规则</dt><dd>{task.partitionMode === 'hash' ? '按指定字段 hash' : '按并行度绑定'}</dd></div>
              {task.partitionMode === 'hash' ? (
                <div className="detail-banner detail-banner--hash">
                  <dt>hash 字段</dt>
                  <dd className="readonly-tags">{task.hashFields.map((field) => <span key={field}>{field}</span>)}</dd>
                </div>
              ) : null}
              <div><dt>是否跳过异常数据</dt><dd>{task.skipInvalid ? '是' : '否'}</dd></div>
              <div><dt>并行度</dt><dd>{task.parallelism ?? '—'}</dd></div>
              <div><dt>优化参数</dt><dd>{task.optimization || '—'}</dd></div>
            </dl>
          </section>

          <section id="detail-alarm" className="form-section">
            <SensSectionTitle title="报警监控" size="large" />
            <p className="alarm-enabled"><span className="alarm-enabled__dot" aria-hidden /> {task.alarmEnabled ? '报警已开启' : '报警未开启'}</p>
            {task.alarmEnabled ? (
              <div className="alarm-card detail-alarm">
                <p className="detail-alarm__condition">
                  <strong>报警条件</strong>
                  <span>近 {task.alarmWindow} 分钟，任务重启次数大于 {task.alarmRetries} 次</span>
                </p>
                <div className="notify-list">
                  <div><span>邮件</span><p><strong>收件地址</strong> 平台管理员 (admin)</p></div>
                  <div><span>Webhook</span><p><strong>Webhook</strong> 未配置</p></div>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <nav className="form-anchors detail-anchors" aria-label="详情页章节">
          {detailAnchors.map((anchor) => (
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

function consumeLabel(value: StreamTask['consumeStart']) {
  if (value === 'earliest') return '从最早位置开始消费';
  if (value === 'latest') return '从最新位置开始消费';
  if (value === 'timestamp') return '时间戳 100ms';
  return '特定偏移量';
}

function fieldLabel(options: Array<{ value: string; label: string }>, value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}
