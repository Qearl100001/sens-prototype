import { useEffect, useState } from 'react';
import {
  SensButton,
  SensDrawer,
  SensEmptyState,
  SensIcon,
  SensTitleBar,
  TableShell,
} from '@sens/prototype-kit';
import type { TaskDraft } from '../domain';

interface DataPreviewDrawerProps {
  open: boolean;
  draft: TaskDraft;
  onClose: () => void;
}

type PreviewState = 'loading' | 'ready' | 'empty';

const previewRows = [
  { key: '1', userId: 'U100328', distinctId: 'device_f8a92', itemId: 'SKU-20260920', crowd: '高活跃会员' },
  { key: '2', userId: 'U100517', distinctId: 'device_21bd7', itemId: 'SKU-20260918', crowd: '流失预警' },
  { key: '3', userId: 'U100624', distinctId: 'device_c319a', itemId: 'SKU-20260916', crowd: '新用户' },
];

export function DataPreviewDrawer({ open, draft, onClose }: DataPreviewDrawerProps) {
  const [state, setState] = useState<PreviewState>('loading');

  useEffect(() => {
    if (!open) return undefined;
    setState('loading');
    const timer = window.setTimeout(() => {
      const scenario = new URLSearchParams(window.location.search).get('preview');
      setState(scenario === 'empty' || !draft.schema ? 'empty' : 'ready');
    }, 520);
    return () => window.clearTimeout(timer);
  }, [draft.schema, open]);

  return (
    <SensDrawer
      open={open}
      size="large"
      onClose={onClose}
      className="preview-drawer"
      titleBar={(
        <SensTitleBar
          title="来源数据预览"
          onBack={onClose}
          actions={<SensButton tone="secondary" onClick={onClose}>关闭</SensButton>}
        />
      )}
    >
      <div className="preview-drawer__body" data-testid="data-preview-drawer">
        <div className="preview-summary">
          <div>
            <span>来源连接</span>
            <strong>{draft.sourceConnection || '—'}</strong>
          </div>
          <div>
            <span>来源数据</span>
            <strong>{draft.sourceData || '—'}</strong>
          </div>
          <div>
            <span>Schema</span>
            <strong>{draft.schema || '—'}</strong>
          </div>
          <SensButton
            tone="secondary"
            icon={<SensIcon name="reload" />}
            onClick={() => {
              setState('loading');
              window.setTimeout(() => setState(draft.schema ? 'ready' : 'empty'), 520);
            }}
          >
            刷新
          </SensButton>
        </div>

        {state === 'loading' ? (
          <div className="preview-state" role="status">
            <SensIcon name="loading" className="preview-loading" />
            <strong>正在获取来源数据</strong>
            <span>请稍候…</span>
          </div>
        ) : null}

        {state === 'empty' ? (
          <div className="preview-state">
            <SensEmptyState
              scope="non-page"
              type="noData"
              title="暂无数据"
              description="当前来源和 Schema 未返回可预览数据"
            />
          </div>
        ) : null}

        {state === 'ready' ? (
          <div className="preview-table">
            <p>展示最新 3 条模拟数据，仅用于确认字段结构。</p>
            <TableShell
              rowKey="key"
              pagination={false}
              columns={[
                { title: 'user id', dataIndex: 'userId', key: 'userId' },
                { title: 'distinct id', dataIndex: 'distinctId', key: 'distinctId' },
                { title: 'Item id', dataIndex: 'itemId', key: 'itemId' },
                { title: '人群', dataIndex: 'crowd', key: 'crowd' },
              ]}
              dataSource={previewRows}
            />
          </div>
        ) : null}
      </div>
    </SensDrawer>
  );
}
